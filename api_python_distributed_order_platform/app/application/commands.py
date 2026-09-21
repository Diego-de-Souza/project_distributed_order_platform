"""
Lado de escrita do CQRS: cada função aqui muda estado (cria, atualiza,
transiciona). Nenhuma delas devolve mais dado do que o necessário pra
resposta HTTP — não existe "get" escondido no meio de um command.

São funções async simples recebendo os ports como parâmetro, não classes
"UseCase" com construtor — o mesmo objetivo de injeção de dependência do
Java/NestJS, só que resolvido pelo próprio `Depends` do FastAPI em vez de
um container de DI dedicado.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.application.events import DomainEvent, EventBus
from app.application.ports import (
    ClientRepository,
    OrderRepository,
    PaymentGateway,
    PaymentRepository,
    ProductRepository,
    StockRepository,
    UnitOfWork,
)
from app.domain.exceptions import BusinessRuleError, ConflictError, GatewayError, NotFoundError
from app.domain.models import Client, Order, OrderItem, Payment, Product, Stock

import asyncio


# ---------------------------------------------------------------- Client --

async def create_client(name: str, email: str, clients: ClientRepository) -> Client:
    return await clients.create(Client(name=name, email=email))


async def delete_client(client_id: str, clients: ClientRepository) -> None:
    client = await clients.get_by_id(client_id)
    if client is None:
        raise NotFoundError("Client not found")
    await clients.delete(client_id)


# --------------------------------------------------------------- Product --

async def create_product(
    sku: str, name: str, price: float, initial_stock: int,
    products: ProductRepository, stocks: StockRepository,
) -> Product:
    if await products.get_by_sku(sku) is not None:
        raise ConflictError("Product with this SKU already exists")

    created = await products.create(Product(sku=sku, name=name, price=price))
    await stocks.create(Stock(product_id=created.id, available_quantity=initial_stock))
    return created


# ----------------------------------------------------------------- Stock --

async def update_stock(
    product_id: str, available_quantity: int, reserved_quantity: int | None,
    stocks: StockRepository,
) -> Stock:
    stock = await stocks.get_by_id(product_id)
    if stock is None:
        raise NotFoundError("Stock not found")
    stock.set_quantities(available_quantity, reserved_quantity if reserved_quantity is not None else stock.reserved_quantity)
    return await stocks.update(stock)


async def reserve_stock(product_id: str, quantity: int, stocks: StockRepository, events: EventBus) -> Stock:
    stock = await stocks.get_by_id(product_id)
    if stock is None:
        raise NotFoundError("Stock not found")
    try:
        stock.reserve(quantity)
    except ValueError as e:
        raise BusinessRuleError(str(e)) from e
    updated = await stocks.update(stock)
    await events.publish(DomainEvent("stock.reserved", {"productId": product_id}))
    return updated


async def release_stock(product_id: str, quantity: int, stocks: StockRepository, events: EventBus) -> Stock:
    stock = await stocks.get_by_id(product_id)
    if stock is None:
        raise NotFoundError("Stock not found")
    try:
        stock.release(quantity)
    except ValueError as e:
        raise BusinessRuleError(str(e)) from e
    updated = await stocks.update(stock)
    await events.publish(DomainEvent("stock.released", {"productId": product_id}))
    return updated


# ----------------------------------------------------------------- Order --

@dataclass(frozen=True)
class OrderItemRequest:
    product_id: str
    quantity: int


async def create_order(
    client_id: str, items: list[OrderItemRequest],
    clients: ClientRepository, products: ProductRepository, stocks: StockRepository, orders: OrderRepository,
    events: EventBus,
) -> Order:
    if not items:
        raise BusinessRuleError("Order must have at least one item")

    client = await clients.get_by_id(client_id)
    if client is None:
        raise NotFoundError("Client not found")
    if not client.can_create_order():
        raise BusinessRuleError("Inactive client cannot create orders")

    order = Order(client_id=client_id)

    for item_req in items:
        product = await products.get_by_id(item_req.product_id)
        if product is None:
            raise NotFoundError(f"Product not found: {item_req.product_id}")
        if not product.can_be_ordered():
            raise BusinessRuleError(f"Product inactive: {item_req.product_id}")

        stock = await stocks.get_by_id(item_req.product_id)
        if stock is None:
            raise NotFoundError(f"Stock not found: {item_req.product_id}")

        try:
            stock.reserve(item_req.quantity)
        except ValueError as e:
            raise BusinessRuleError(str(e)) from e

        await stocks.update(stock)
        order.add_item(OrderItem(item_req.product_id, item_req.quantity, product.price))
        await events.publish(DomainEvent("stock.reserved", {"productId": item_req.product_id}))

    created = await orders.create(order)
    await events.publish(DomainEvent("order.created", {"orderId": created.id}))
    return created


async def confirm_order(order_id: str, orders: OrderRepository, events: EventBus) -> Order:
    order = await orders.get_by_id(order_id)
    if order is None:
        raise NotFoundError("Order not found")
    try:
        order.confirm()
    except ValueError as e:
        raise BusinessRuleError(str(e)) from e
    updated = await orders.update(order)
    await events.publish(DomainEvent("order.confirmed", {"orderId": order_id}))
    return updated


async def cancel_order(order_id: str, orders: OrderRepository, stocks: StockRepository, events: EventBus) -> Order:
    order = await orders.get_by_id(order_id)
    if order is None:
        raise NotFoundError("Order not found")
    try:
        order.cancel()
    except ValueError as e:
        raise BusinessRuleError(str(e)) from e

    for item in order.items:
        stock = await stocks.get_by_id(item.product_id)
        if stock is None:
            raise NotFoundError(f"Stock not found: {item.product_id}")
        stock.release(item.quantity)
        await stocks.update(stock)
        await events.publish(DomainEvent("stock.released", {"productId": item.product_id}))

    updated = await orders.update(order)
    await events.publish(DomainEvent("order.cancelled", {"orderId": order_id}))
    return updated


# --------------------------------------------------------------- Payment --

_MAX_RETRIES = 3
_RETRIABLE_HINTS = ("timeout", "econnreset", "enotfound", "socket", "network", "502", "503", "504")


async def create_payment(
    order_id: str, requested_amount: float | None,
    orders: OrderRepository, payments: PaymentRepository,
    make_unit_of_work,  # Callable[[], UnitOfWork]
    gateway: PaymentGateway, events: EventBus,
) -> Payment:
    order = await orders.get_by_id(order_id)
    if order is None:
        raise NotFoundError("Order not found")
    if order.status.value != "PENDING":
        raise BusinessRuleError("Order is not pending")
    if not order.items:
        raise BusinessRuleError("Order has no items")
    if requested_amount is not None and round(requested_amount, 2) != round(order.total, 2):
        raise BusinessRuleError("Payment amount does not match order total")

    payment = await payments.create(Payment(order_id=order.id, amount=order.total))
    idempotency_key = payment.id

    gateway_result = await _charge_with_retry(gateway, payment, idempotency_key)

    async with make_unit_of_work() as uow:
        try:
            if gateway_result["success"]:
                for item in order.items:
                    stock = await uow.stocks.get_by_id(item.product_id)
                    if stock is None:
                        raise NotFoundError(f"Stock not found for product {item.product_id}")
                    stock.consume(item.quantity)
                    await uow.stocks.update(stock)
                    await events.publish(DomainEvent("stock.consumed", {"productId": item.product_id}))

                payment.mark_as_paid(gateway_result.get("external_id") or idempotency_key, gateway_result.get("raw"))
                order.confirm()
            else:
                code = gateway_result.get("error_code") or "GATEWAY_ERROR"
                message = gateway_result.get("error_message") or "Payment failed"
                payment.mark_as_failed(code, message, gateway_result.get("raw"))
                order.register_payment_failure(code, message)

                for item in order.items:
                    stock = await uow.stocks.get_by_id(item.product_id)
                    if stock is None:
                        raise NotFoundError(f"Stock not found for product {item.product_id}")
                    stock.release(item.quantity)
                    await uow.stocks.update(stock)
                    await events.publish(DomainEvent("stock.released", {"productId": item.product_id}))

            await uow.payments.update(payment)
            await uow.orders.update(order)
            await uow.commit()
        except Exception:
            await uow.rollback()
            await events.publish(DomainEvent("payment.failed", {"paymentId": payment.id}))
            raise

    await events.publish(DomainEvent(
        "payment.paid" if gateway_result["success"] else "payment.failed",
        {"paymentId": payment.id},
    ))
    return payment


async def _charge_with_retry(gateway: PaymentGateway, payment: Payment, idempotency_key: str) -> dict:
    try:
        result = await gateway.create_charge(payment.id, payment.order_id, payment.amount, idempotency_key)
        if result.get("success") or result.get("kind") == "BUSINESS":
            return result
        return await _retry_retrieve(gateway, idempotency_key)
    except GatewayError as e:
        if not _is_retriable(e):
            return {"success": False, "kind": "BUSINESS", "error_code": "PAYMENT_REJECTED", "error_message": str(e)}
        return await _retry_retrieve(gateway, idempotency_key)


async def _retry_retrieve(gateway: PaymentGateway, idempotency_key: str) -> dict:
    last_result = {"success": False, "kind": "RETRIABLE", "error_code": "GATEWAY_UNAVAILABLE",
                    "error_message": "Gateway unavailable after retries"}

    for attempt in range(1, _MAX_RETRIES + 1):
        await asyncio.sleep(attempt * 0.5)
        try:
            last_result = await gateway.retrieve_charge(idempotency_key)
            if last_result.get("success") or last_result.get("kind") == "BUSINESS":
                return last_result
        except GatewayError as e:
            retriable = _is_retriable(e)
            last_result = {
                "success": False,
                "kind": "RETRIABLE" if retriable else "BUSINESS",
                "error_code": "GATEWAY_UNAVAILABLE" if retriable else "PAYMENT_REJECTED",
                "error_message": str(e),
            }
            if not retriable:
                return last_result

    return last_result


def _is_retriable(error: Exception) -> bool:
    message = str(error).lower()
    return any(hint in message for hint in _RETRIABLE_HINTS)
