"""Fiação de dependências do FastAPI -- o `Depends` faz aqui o papel do
container de DI do Spring/Nest. Sessão de banco é por-request (aberta no
começo da requisição, commitada no fim, rollback se algo escapar);
Redis/EventBus/Gateway são singletons de processo."""
from __future__ import annotations

from functools import lru_cache
from typing import AsyncIterator, Callable

from fastapi import Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.events import EventBus, build_default_event_bus
from app.config import settings
from app.infrastructure.cache import RedisCacheStore, RedisIdempotencyStore
from app.infrastructure.db import async_session_factory
from app.infrastructure.payment_gateway import StubPaymentGateway
from app.infrastructure.repositories import (
    SqlAlchemyClientRepository, SqlAlchemyOrderRepository, SqlAlchemyPaymentRepository,
    SqlAlchemyProductRepository, SqlAlchemyStockRepository,
)
from app.infrastructure.unit_of_work import SqlAlchemyUnitOfWork


async def get_session() -> AsyncIterator[AsyncSession]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def get_client_repository(session: AsyncSession = Depends(get_session)) -> SqlAlchemyClientRepository:
    return SqlAlchemyClientRepository(session)


def get_product_repository(session: AsyncSession = Depends(get_session)) -> SqlAlchemyProductRepository:
    return SqlAlchemyProductRepository(session)


def get_stock_repository(session: AsyncSession = Depends(get_session)) -> SqlAlchemyStockRepository:
    return SqlAlchemyStockRepository(session)


def get_order_repository(session: AsyncSession = Depends(get_session)) -> SqlAlchemyOrderRepository:
    return SqlAlchemyOrderRepository(session)


def get_payment_repository(session: AsyncSession = Depends(get_session)) -> SqlAlchemyPaymentRepository:
    return SqlAlchemyPaymentRepository(session)


def get_unit_of_work_factory() -> Callable[[], SqlAlchemyUnitOfWork]:
    return SqlAlchemyUnitOfWork


@lru_cache
def get_redis() -> Redis:
    return Redis.from_url(settings.redis_url, decode_responses=True)


def get_cache_store(redis: Redis = Depends(get_redis)) -> RedisCacheStore:
    return RedisCacheStore(redis)


def get_idempotency_store(redis: Redis = Depends(get_redis)) -> RedisIdempotencyStore:
    return RedisIdempotencyStore(redis)


@lru_cache
def get_event_bus() -> EventBus:
    return build_default_event_bus()


@lru_cache
def get_payment_gateway() -> StubPaymentGateway:
    return StubPaymentGateway()
