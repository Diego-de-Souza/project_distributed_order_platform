"""UnitOfWork do fluxo de pagamento: a chamada ao gateway externo (HTTP)
nunca pode ficar presa dentro de uma transação de banco. Por isso o
pagamento usa uma sessão própria, aberta e commitada manualmente, em vez
da sessão por-request comum aos outros casos de uso — mesmo papel do
UnitOfWorkAdapter (PROPAGATION_REQUIRES_NEW) da API Java."""
from __future__ import annotations

from app.infrastructure.db import async_session_factory
from app.infrastructure.repositories import (
    SqlAlchemyOrderRepository, SqlAlchemyPaymentRepository, SqlAlchemyStockRepository,
)


class SqlAlchemyUnitOfWork:
    async def __aenter__(self) -> "SqlAlchemyUnitOfWork":
        self.session = async_session_factory()
        self.orders = SqlAlchemyOrderRepository(self.session)
        self.stocks = SqlAlchemyStockRepository(self.session)
        self.payments = SqlAlchemyPaymentRepository(self.session)
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        await self.session.close()

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()
