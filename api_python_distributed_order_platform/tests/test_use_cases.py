"""Testes dos commands sobre os fakes em memória -- mesmo alvo dos dois
testes JUnit da API Java (CreateOrderUseCaseTest, ReserveStockUseCaseTest),
mais um conjunto extra pra pagamento (decline / timeout-com-retry) que só
dá pra rodar de verdade aqui, já que o Maven está bloqueado no ambiente."""
from __future__ import annotations

import pytest

from app.application import commands
from app.application.commands import OrderItemRequest
from app.domain.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.domain.models import Client, OrderStatus, PaymentStatus, Product, Stock
from app.infrastructure.payment_gateway import StubPaymentGateway
from tests.fakes import (
    FakeClientRepository, FakeEventBus, FakeOrderRepository, FakePaymentRepository,
    FakeProductRepository, FakeStockRepository,
)


class FakeUnitOfWork:
    def __init__(self, orders: FakeOrderRepository, stocks: FakeStockRepository, payments: FakePaymentRepository) -> None:
        self.orders = orders
        self.stocks = stocks
        self.payments = payments
        self.committed = False
        self.rolled_back = False

    async def __aenter__(self) -> "FakeUnitOfWork":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        return None

    async def commit(self) -> None:
        self.committed = True

    async def rollback(self) -> None:
        self.rolled_back = True


# ----------------------------------------------------------------- Stock --

async def test_reserve_stock_success() -> None:
    stocks = FakeStockRepository()
    await stocks.create(Stock(product_id="p1", available_quantity=10))
    events = FakeEventBus()

    result = await commands.reserve_stock("p1", 4, stocks, events)

    assert result.available_quantity == 6
    assert result.reserved_quantity == 4
    assert ("stock.reserved", {"productId": "p1"}) in events.published


async def test_reserve_stock_insufficient_quantity_raises_business_rule_error() -> None:
    stocks = FakeStockRepository()
    await stocks.create(Stock(product_id="p1", available_quantity=2))
    events = FakeEventBus()

    with pytest.raises(BusinessRuleError):
        await commands.reserve_stock("p1", 5, stocks, events)


async def test_reserve_stock_not_found_raises_not_found_error() -> None:
    stocks = FakeStockRepository()
    events = FakeEventBus()

    with pytest.raises(NotFoundError):
        await commands.reserve_stock("missing", 1, stocks, events)


async def test_stock_update_conflict_when_version_stale() -> None:
    stocks = FakeStockRepository()
    stock = await stocks.create(Stock(product_id="p1", available_quantity=10))
    stock.available_quantity = 5
    await stocks.update(stock)  # version agora é 1 no repositório

    stale = Stock(product_id="p1", available_quantity=1, version=0)  # versão velha
    with pytest.raises(ConflictError):
        await stocks.update(stale)


# ----------------------------------------------------------------- Order --

async def _setup_order_fixtures() -> dict:
    clients, products, stocks, orders, events = (
        FakeClientRepository(), FakeProductRepository(), FakeStockRepository(), FakeOrderRepository(), FakeEventBus(),
    )
    client = await clients.create(Client(name="Ana", email="ana@example.com"))
    product = await products.create(Product(sku="SKU-1", name="Widget", price=10.0))
    await stocks.create(Stock(product_id=product.id, available_quantity=5))
    return dict(clients=clients, products=products, stocks=stocks, orders=orders, events=events, client=client, product=product)


async def test_create_order_success_reserves_stock_and_computes_total() -> None:
    f = await _setup_order_fixtures()

    order = await commands.create_order(
        f["client"].id, [OrderItemRequest(product_id=f["product"].id, quantity=2)],
        f["clients"], f["products"], f["stocks"], f["orders"], f["events"],
    )

    assert order.status == OrderStatus.PENDING
    assert order.total == 20.0
    stock = await f["stocks"].get_by_id(f["product"].id)
    assert stock.available_quantity == 3
    assert stock.reserved_quantity == 2
    assert ("order.created", {"orderId": order.id}) in f["events"].published


async def test_create_order_with_inactive_client_raises_business_rule_error() -> None:
    f = await _setup_order_fixtures()
    f["client"].status = f["client"].status.__class__("INACTIVE")
    await f["clients"].update(f["client"])

    with pytest.raises(BusinessRuleError):
        await commands.create_order(
            f["client"].id, [OrderItemRequest(product_id=f["product"].id, quantity=1)],
            f["clients"], f["products"], f["stocks"], f["orders"], f["events"],
        )


async def test_create_order_without_items_raises_business_rule_error() -> None:
    f = await _setup_order_fixtures()

    with pytest.raises(BusinessRuleError):
        await commands.create_order(f["client"].id, [], f["clients"], f["products"], f["stocks"], f["orders"], f["events"])


# --------------------------------------------------------------- Payment --

async def _setup_payment_fixtures(amount_cents: int) -> dict:
    f = await _setup_order_fixtures()
    quantity = 1
    price = amount_cents / 100
    product = await f["products"].create(Product(sku="SKU-PAY", name="Priced item", price=price))
    await f["stocks"].create(Stock(product_id=product.id, available_quantity=quantity))

    order = await commands.create_order(
        f["client"].id, [OrderItemRequest(product_id=product.id, quantity=quantity)],
        f["clients"], f["products"], f["stocks"], f["orders"], f["events"],
    )

    payments = FakePaymentRepository()
    gateway = StubPaymentGateway()
    uow = FakeUnitOfWork(f["orders"], f["stocks"], payments)
    f.update(order=order, payments=payments, gateway=gateway, uow=uow, product=product)
    return f


async def test_create_payment_approved_confirms_order_and_consumes_stock() -> None:
    f = await _setup_payment_fixtures(amount_cents=1000)  # termina em .00 -> aprovado

    payment = await commands.create_payment(
        f["order"].id, None, f["orders"], f["payments"], lambda: f["uow"], f["gateway"], f["events"],
    )

    assert payment.status == PaymentStatus.PAID
    order = await f["orders"].get_by_id(f["order"].id)
    assert order.status == OrderStatus.CONFIRMED
    stock = await f["stocks"].get_by_id(f["product"].id)
    assert stock.reserved_quantity == 0
    assert f["uow"].committed is True


async def test_create_payment_declined_cancels_order_and_releases_stock() -> None:
    f = await _setup_payment_fixtures(amount_cents=1013)  # termina em .13 -> recusado

    payment = await commands.create_payment(
        f["order"].id, None, f["orders"], f["payments"], lambda: f["uow"], f["gateway"], f["events"],
    )

    assert payment.status == PaymentStatus.FAILED
    assert payment.last_error_code == "CARD_DECLINED"
    order = await f["orders"].get_by_id(f["order"].id)
    assert order.status == OrderStatus.CANCELLED
    stock = await f["stocks"].get_by_id(f["product"].id)
    assert stock.available_quantity == 1
    assert stock.reserved_quantity == 0


async def test_create_payment_client_timeout_recovers_via_retrieve_charge() -> None:
    f = await _setup_payment_fixtures(amount_cents=1066)  # termina em .66 -> timeout no cliente, sucesso no gateway

    payment = await commands.create_payment(
        f["order"].id, None, f["orders"], f["payments"], lambda: f["uow"], f["gateway"], f["events"],
    )

    assert payment.status == PaymentStatus.PAID
    order = await f["orders"].get_by_id(f["order"].id)
    assert order.status == OrderStatus.CONFIRMED
