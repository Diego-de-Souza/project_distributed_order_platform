"""Domínio -> DTO de resposta. Fica separado dos routers pelo mesmo motivo
dos *Mapper.java: o router não deveria saber como um Client vira JSON."""
from __future__ import annotations

from app.domain.models import Client, Order, Payment, Product, Stock
from app.presentation.schemas import (
    ClientResponse, OrderItemResponse, OrderResponse, PaymentResponse, ProductResponse, StockResponse,
)


def to_client_response(client: Client) -> ClientResponse:
    return ClientResponse(
        id=client.id, name=client.name, email=client.email, status=client.status.value,
        createdAt=client.created_at, updatedAt=client.updated_at,
    )


def to_product_response(product: Product) -> ProductResponse:
    return ProductResponse(id=product.id, sku=product.sku, name=product.name, price=product.price, status=product.status.value)


def to_stock_response(stock: Stock) -> StockResponse:
    return StockResponse(
        productId=stock.product_id, availableQuantity=stock.available_quantity,
        reservedQuantity=stock.reserved_quantity, version=stock.version,
    )


def to_order_response(order: Order) -> OrderResponse:
    return OrderResponse(
        id=order.id, clientId=order.client_id, status=order.status.value, total=order.total,
        paymentErrorCode=order.payment_error_code, paymentErrorMessage=order.payment_error_message,
        version=order.version,
        items=[
            OrderItemResponse(productId=i.product_id, quantity=i.quantity, unitPrice=i.unit_price, subtotal=i.subtotal)
            for i in order.items
        ],
    )


def to_payment_response(payment: Payment) -> PaymentResponse:
    return PaymentResponse(
        id=payment.id, orderId=payment.order_id, amount=payment.amount, status=payment.status.value,
        attempts=payment.attempts, lastErrorCode=payment.last_error_code,
        lastErrorMessage=payment.last_error_message, externalId=payment.external_id,
    )
