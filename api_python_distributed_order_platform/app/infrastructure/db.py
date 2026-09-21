from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def create_all_tables() -> None:
    """ponytail: ddl-auto na mão, igual ao spring.jpa.hibernate.ddl-auto=update
    da API Java — suficiente pro alcance didático; uma migração de verdade
    usaria Alembic."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
