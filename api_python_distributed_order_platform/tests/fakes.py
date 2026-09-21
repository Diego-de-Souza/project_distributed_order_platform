"""Fakes em memória, mesmo papel do InMemoryFakes.java: testar os
commands/queries sem precisar de Postgres/Redis de verdade."""
from __future__ import annotations

from app.domain.exceptions import ConflictError, NotFoundError
from app.domain.models import Client, Order, Payment, Product, Stock


class FakeClientRepository:
    def __init__(self) -> None:
        self._data: dict[str, Client] = {}

    async def create(self, client: Client) -> Client:
        self._data[client.id] = client
        return client

    async def get_by_id(self, client_id: str) -> Client | None:
        return self._data.get(client_id)

    async def list_all(self) -> list[Client]:
        return list(self._data.values())

    async def update(self, client: Client) -> Client:
        self._data[client.id] = client
        return client

    async def delete(self, client_id: str) -> None:
        self._data.pop(client_id, None)


class FakeProductRepository:
    def __init__(self) -> None:
        self._data: dict[str, Product] = {}

    async def create(self, product: Product) -> Product:
        self._data[product.id] = product
        return product

    async def get_by_id(self, product_id: str) -> Product | None:
        return self._data.get(product_id)

    async def get_by_sku(self, sku: str) -> Product | None:
        return next((p for p in self._data.values() if p.sku == sku), None)

    async def list_all(self) -> list[Product]:
        return list(self._data.values())

    async def update(self, product: Product) -> Product:
        self._data[product.id] = product
        return product

    async def delete(self, product_id: str) -> None:
        self._data.pop(product_id, None)


class FakeStockRepository:
    def __init__(self) -> None:
        self._data: dict[str, Stock] = {}
        self._versions: dict[str, int] = {}

    async def create(self, stock: Stock) -> Stock:
        self._data[stock.product_id] = stock
        self._versions[stock.product_id] = stock.version
        return stock

    async def get_by_id(self, product_id: str) -> Stock | None:
        return self._data.get(product_id)

    async def list_all(self) -> list[Stock]:
        return list(self._data.values())

    async def update(self, stock: Stock) -> Stock:
        # Simula o mesmo optimistic lock do SQLAlchemy/JPA: se a versão que
        # chegou não bate com a última salva, é conflito de concorrência.
        current_version = self._versions.get(stock.product_id, 0)
        if stock.version != current_version:
            raise ConflictError("Stock was modified by another request, retry")
        stock.version = current_version + 1
        self._versions[stock.product_id] = stock.version
        self._data[stock.product_id] = stock
        return stock

    async def delete(self, product_id: str) -> None:
        self._data.pop(product_id, None)


class FakeOrderRepository:
    def __init__(self) -> None:
        self._data: dict[str, Order] = {}

    async def create(self, order: Order) -> Order:
        self._data[order.id] = order
        return order

    async def get_by_id(self, order_id: str) -> Order | None:
        return self._data.get(order_id)

    async def list_all(self) -> list[Order]:
        return list(self._data.values())

    async def update(self, order: Order) -> Order:
        if order.id not in self._data:
            raise NotFoundError(f"Order not found: {order.id}")
        self._data[order.id] = order
        return order

    async def delete(self, order_id: str) -> None:
        self._data.pop(order_id, None)


class FakePaymentRepository:
    def __init__(self) -> None:
        self._data: dict[str, Payment] = {}

    async def create(self, payment: Payment) -> Payment:
        self._data[payment.id] = payment
        return payment

    async def get_by_id(self, payment_id: str) -> Payment | None:
        return self._data.get(payment_id)

    async def update(self, payment: Payment) -> Payment:
        self._data[payment.id] = payment
        return payment


class FakeEventBus:
    def __init__(self) -> None:
        self.published: list[tuple[str, dict]] = []

    async def publish(self, event) -> None:
        self.published.append((event.name, event.payload))
