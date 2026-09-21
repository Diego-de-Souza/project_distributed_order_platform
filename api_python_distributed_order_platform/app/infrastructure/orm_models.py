"""
Modelos SQLAlchemy (linha de persistência), separados dos dataclasses de
domínio em app/domain/models.py — mesma separação Entity de domínio vs
Entity JPA que a API Java faz, só que aqui o mapeamento de Order/OrderItem
é um relacionamento um-para-muitos de verdade (tabela order_items com FK),
diferente do @ElementCollection/@Embeddable do Java. É um jeito diferente
de resolver o mesmo problema — bom material de comparação entre as três
APIs.

Stock e Order carregam `version_id_col`: é o Optimistic Locking do
SQLAlchemy, o mesmo papel do @Version do Hibernate. Num UPDATE concorrente
com a versão errada, o SQLAlchemy levanta StaleDataError.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db import Base


class ClientORM(Base):
    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str]
    email: Mapped[str]
    status: Mapped[str]
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]


class ProductORM(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(primary_key=True)
    sku: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str]
    price: Mapped[float]
    status: Mapped[str]


class StockORM(Base):
    __tablename__ = "stocks"

    product_id: Mapped[str] = mapped_column(primary_key=True)
    available_quantity: Mapped[int]
    reserved_quantity: Mapped[int]
    version: Mapped[int] = mapped_column(default=0)

    __mapper_args__ = {"version_id_col": version}


class OrderItemORM(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    product_id: Mapped[str]
    quantity: Mapped[int]
    unit_price: Mapped[float]

    order: Mapped["OrderORM"] = relationship(back_populates="items")


class OrderORM(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(primary_key=True)
    client_id: Mapped[str]
    status: Mapped[str]
    total: Mapped[float] = mapped_column(default=0.0)
    payment_error_code: Mapped[str | None] = mapped_column(default=None)
    payment_error_message: Mapped[str | None] = mapped_column(default=None)
    version: Mapped[int] = mapped_column(default=0)

    items: Mapped[list[OrderItemORM]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )

    __mapper_args__ = {"version_id_col": version}


class PaymentORM(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(primary_key=True)
    order_id: Mapped[str]
    amount: Mapped[float]
    status: Mapped[str]
    attempts: Mapped[int] = mapped_column(default=0)
    last_error_code: Mapped[str | None] = mapped_column(default=None)
    last_error_message: Mapped[str | None] = mapped_column(default=None)
    gateway_raw_response: Mapped[dict | None] = mapped_column(JSON, default=None)
    external_id: Mapped[str | None] = mapped_column(default=None)
