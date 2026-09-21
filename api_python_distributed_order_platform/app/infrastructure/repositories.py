from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.exc import StaleDataError

from app.domain.exceptions import ConflictError, NotFoundError
from app.domain.models import (
    Client, ClientStatus, Order, OrderItem, OrderStatus, Payment, PaymentStatus, Product, ProductStatus, Stock,
)
from app.infrastructure.orm_models import ClientORM, OrderItemORM, OrderORM, PaymentORM, ProductORM, StockORM


# ---------------------------------------------------------------- Client --

class SqlAlchemyClientRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, client: Client) -> Client:
        orm = ClientORM(
            id=client.id, name=client.name, email=client.email,
            status=client.status.value, created_at=client.created_at, updated_at=client.updated_at,
        )
        self.session.add(orm)
        await self.session.flush()
        return client

    async def get_by_id(self, client_id: str) -> Client | None:
        orm = await self.session.get(ClientORM, client_id)
        return _client_to_domain(orm) if orm else None

    async def list_all(self) -> list[Client]:
        result = await self.session.execute(select(ClientORM))
        return [_client_to_domain(o) for o in result.scalars().all()]

    async def update(self, client: Client) -> Client:
        orm = await self.session.get(ClientORM, client.id)
        if orm is None:
            raise NotFoundError(f"Client not found: {client.id}")
        orm.name = client.name
        orm.email = client.email
        orm.status = client.status.value
        orm.updated_at = datetime.now(timezone.utc)
        await self.session.flush()
        return client

    async def delete(self, client_id: str) -> None:
        orm = await self.session.get(ClientORM, client_id)
        if orm is not None:
            await self.session.delete(orm)
            await self.session.flush()


def _client_to_domain(orm: ClientORM) -> Client:
    return Client(
        id=orm.id, name=orm.name, email=orm.email, status=ClientStatus(orm.status),
        created_at=orm.created_at, updated_at=orm.updated_at,
    )


# --------------------------------------------------------------- Product --

class SqlAlchemyProductRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, product: Product) -> Product:
        orm = ProductORM(id=product.id, sku=product.sku, name=product.name, price=product.price, status=product.status.value)
        self.session.add(orm)
        await self.session.flush()
        return product

    async def get_by_id(self, product_id: str) -> Product | None:
        orm = await self.session.get(ProductORM, product_id)
        return _product_to_domain(orm) if orm else None

    async def get_by_sku(self, sku: str) -> Product | None:
        result = await self.session.execute(select(ProductORM).where(ProductORM.sku == sku))
        orm = result.scalar_one_or_none()
        return _product_to_domain(orm) if orm else None

    async def list_all(self) -> list[Product]:
        result = await self.session.execute(select(ProductORM))
        return [_product_to_domain(o) for o in result.scalars().all()]

    async def update(self, product: Product) -> Product:
        orm = await self.session.get(ProductORM, product.id)
        if orm is None:
            raise NotFoundError(f"Product not found: {product.id}")
        orm.name = product.name
        orm.price = product.price
        orm.status = product.status.value
        await self.session.flush()
        return product

    async def delete(self, product_id: str) -> None:
        orm = await self.session.get(ProductORM, product_id)
        if orm is not None:
            await self.session.delete(orm)
            await self.session.flush()


def _product_to_domain(orm: ProductORM) -> Product:
    return Product(id=orm.id, sku=orm.sku, name=orm.name, price=orm.price, status=ProductStatus(orm.status))


# ----------------------------------------------------------------- Stock --

class SqlAlchemyStockRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, stock: Stock) -> Stock:
        orm = StockORM(product_id=stock.product_id, available_quantity=stock.available_quantity,
                        reserved_quantity=stock.reserved_quantity)
        self.session.add(orm)
        await self.session.flush()
        return _stock_to_domain(orm)

    async def get_by_id(self, product_id: str) -> Stock | None:
        orm = await self.session.get(StockORM, product_id)
        return _stock_to_domain(orm) if orm else None

    async def list_all(self) -> list[Stock]:
        result = await self.session.execute(select(StockORM))
        return [_stock_to_domain(o) for o in result.scalars().all()]

    # Recarrega a MESMA linha gerenciada pela sessão (session.get usa a
    # identity map) e só copia as quantidades — é o version_id_col do
    # SQLAlchemy que compara a versão certa no UPDATE, igual ao @Version
    # da API Java. StaleDataError == "outra requisição mudou isso primeiro".
    async def update(self, stock: Stock) -> Stock:
        orm = await self.session.get(StockORM, stock.product_id)
        if orm is None:
            raise NotFoundError(f"Stock not found: {stock.product_id}")
        orm.available_quantity = stock.available_quantity
        orm.reserved_quantity = stock.reserved_quantity
        try:
            await self.session.flush()
        except StaleDataError as e:
            raise ConflictError("Stock was modified by another request, retry") from e
        return _stock_to_domain(orm)

    async def delete(self, product_id: str) -> None:
        orm = await self.session.get(StockORM, product_id)
        if orm is not None:
            await self.session.delete(orm)
            await self.session.flush()


def _stock_to_domain(orm: StockORM) -> Stock:
    return Stock(product_id=orm.product_id, available_quantity=orm.available_quantity,
                 reserved_quantity=orm.reserved_quantity, version=orm.version)


# ----------------------------------------------------------------- Order --

class SqlAlchemyOrderRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, order: Order) -> Order:
        orm = OrderORM(
            id=order.id, client_id=order.client_id, status=order.status.value, total=order.total,
            payment_error_code=order.payment_error_code, payment_error_message=order.payment_error_message,
            items=[OrderItemORM(product_id=i.product_id, quantity=i.quantity, unit_price=i.unit_price) for i in order.items],
        )
        self.session.add(orm)
        await self.session.flush()
        return order

    async def get_by_id(self, order_id: str) -> Order | None:
        orm = await self.session.get(OrderORM, order_id)
        return _order_to_domain(orm) if orm else None

    async def list_all(self) -> list[Order]:
        result = await self.session.execute(select(OrderORM))
        return [_order_to_domain(o) for o in result.scalars().all()]

    async def update(self, order: Order) -> Order:
        orm = await self.session.get(OrderORM, order.id)
        if orm is None:
            raise NotFoundError(f"Order not found: {order.id}")
        orm.status = order.status.value
        orm.total = order.total
        orm.payment_error_code = order.payment_error_code
        orm.payment_error_message = order.payment_error_message
        try:
            await self.session.flush()
        except StaleDataError as e:
            raise ConflictError("Order was modified by another request, retry") from e
        return _order_to_domain(orm)

    async def delete(self, order_id: str) -> None:
        orm = await self.session.get(OrderORM, order_id)
        if orm is not None:
            await self.session.delete(orm)
            await self.session.flush()


def _order_to_domain(orm: OrderORM) -> Order:
    return Order(
        id=orm.id, client_id=orm.client_id, status=OrderStatus(orm.status), total=orm.total,
        payment_error_code=orm.payment_error_code, payment_error_message=orm.payment_error_message,
        version=orm.version,
        items=[OrderItem(product_id=i.product_id, quantity=i.quantity, unit_price=i.unit_price) for i in orm.items],
    )


# --------------------------------------------------------------- Payment --

class SqlAlchemyPaymentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, payment: Payment) -> Payment:
        orm = PaymentORM(
            id=payment.id, order_id=payment.order_id, amount=payment.amount, status=payment.status.value,
            attempts=payment.attempts, last_error_code=payment.last_error_code,
            last_error_message=payment.last_error_message, gateway_raw_response=payment.gateway_raw_response,
            external_id=payment.external_id,
        )
        self.session.add(orm)
        await self.session.flush()
        return payment

    async def get_by_id(self, payment_id: str) -> Payment | None:
        orm = await self.session.get(PaymentORM, payment_id)
        return _payment_to_domain(orm) if orm else None

    async def update(self, payment: Payment) -> Payment:
        orm = await self.session.get(PaymentORM, payment.id)
        if orm is None:
            raise NotFoundError(f"Payment not found: {payment.id}")
        orm.status = payment.status.value
        orm.last_error_code = payment.last_error_code
        orm.last_error_message = payment.last_error_message
        orm.gateway_raw_response = payment.gateway_raw_response
        orm.external_id = payment.external_id
        await self.session.flush()
        return payment


def _payment_to_domain(orm: PaymentORM) -> Payment:
    return Payment(
        id=orm.id, order_id=orm.order_id, amount=orm.amount, status=PaymentStatus(orm.status),
        attempts=orm.attempts, last_error_code=orm.last_error_code, last_error_message=orm.last_error_message,
        gateway_raw_response=orm.gateway_raw_response, external_id=orm.external_id,
    )
