"""
Mesmo domínio das APIs NestJS e Java (Client, Product, Stock, Order,
OrderItem, Payment), reescrito em Python "puro" — nenhuma dependência de
FastAPI, SQLAlchemy ou Pydantic aqui. As regras são as já validadas nas
outras duas implementações; a novidade da API Python não é o domínio, é a
arquitetura em volta dele (CQRS + Event-Driven + asyncio).

Diferente da API Java, aqui não criamos Value Objects próprios (Money,
Email) — essa foi uma lição específica do módulo Java. Em Python a
validação simples inline já cobre o mesmo invariante sem precisar de mais
uma classe por campo.
"""
from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

_EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _new_id() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ClientStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class ProductStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class OrderStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    AUTHORIZED = "AUTHORIZED"
    PAID = "PAID"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


def validate_email(value: str) -> str:
    if not value or not _EMAIL_PATTERN.match(value):
        raise ValueError("Email is invalid")
    return value


@dataclass
class Client:
    name: str
    email: str
    id: str = field(default_factory=_new_id)
    status: ClientStatus = ClientStatus.ACTIVE
    created_at: datetime = field(default_factory=_now)
    updated_at: datetime = field(default_factory=_now)

    def __post_init__(self) -> None:
        if not self.name or not self.name.strip():
            raise ValueError("Name is required")
        validate_email(self.email)

    def can_create_order(self) -> bool:
        return self.status == ClientStatus.ACTIVE


@dataclass
class Product:
    sku: str
    name: str
    price: float
    id: str = field(default_factory=_new_id)
    status: ProductStatus = ProductStatus.ACTIVE

    def __post_init__(self) -> None:
        if not self.sku or not self.sku.strip():
            raise ValueError("SKU is required")
        if not self.name or not self.name.strip():
            raise ValueError("Name is required")
        if self.price <= 0:
            raise ValueError("Price must be greater than 0")

    def can_be_ordered(self) -> bool:
        return self.status == ProductStatus.ACTIVE


@dataclass
class Stock:
    product_id: str
    available_quantity: int
    reserved_quantity: int = 0
    version: int = 0

    def __post_init__(self) -> None:
        if self.available_quantity < 0 or self.reserved_quantity < 0:
            raise ValueError("Quantities must be greater than or equal to 0")

    def reserve(self, quantity: int) -> None:
        if quantity <= 0:
            raise ValueError("Quantity must be greater than 0")
        if quantity > self.available_quantity:
            raise ValueError("Quantity must be less than or equal to available quantity")
        self.available_quantity -= quantity
        self.reserved_quantity += quantity

    def release(self, quantity: int) -> None:
        if quantity <= 0:
            raise ValueError("Quantity must be greater than 0")
        if quantity > self.reserved_quantity:
            raise ValueError("Quantity must be less than or equal to reserved quantity")
        self.reserved_quantity -= quantity
        self.available_quantity += quantity

    def consume(self, quantity: int) -> None:
        if quantity <= 0:
            raise ValueError("Quantity must be greater than 0")
        if quantity > self.reserved_quantity:
            raise ValueError("Quantity must be less than or equal to reserved quantity")
        self.reserved_quantity -= quantity

    def set_quantities(self, available_quantity: int, reserved_quantity: int) -> None:
        if available_quantity < 0 or reserved_quantity < 0:
            raise ValueError("Quantities must be greater than or equal to 0")
        self.available_quantity = available_quantity
        self.reserved_quantity = reserved_quantity


@dataclass
class OrderItem:
    product_id: str
    quantity: int
    unit_price: float

    def __post_init__(self) -> None:
        if self.quantity <= 0:
            raise ValueError("Quantity must be greater than 0")
        if self.unit_price <= 0:
            raise ValueError("Unit price must be greater than 0")

    @property
    def subtotal(self) -> float:
        return round(self.unit_price * self.quantity, 2)


@dataclass
class Order:
    client_id: str
    id: str = field(default_factory=_new_id)
    items: list[OrderItem] = field(default_factory=list)
    status: OrderStatus = OrderStatus.PENDING
    total: float = 0.0
    payment_error_code: Optional[str] = None
    payment_error_message: Optional[str] = None
    version: int = 0

    def add_item(self, item: OrderItem) -> None:
        self.items.append(item)
        self.total = round(sum(i.subtotal for i in self.items), 2)

    def confirm(self) -> None:
        if self.status != OrderStatus.PENDING:
            raise ValueError("Order must be in pending status to be confirmed")
        self.status = OrderStatus.CONFIRMED
        self.payment_error_code = None
        self.payment_error_message = None

    def cancel(self) -> None:
        if self.status != OrderStatus.PENDING:
            raise ValueError("Order must be in pending status to be cancelled")
        self.status = OrderStatus.CANCELLED

    def register_payment_failure(self, code: str, message: str) -> None:
        if self.status != OrderStatus.PENDING:
            raise ValueError("Order must be in pending status to register payment failure")
        self.payment_error_code = code
        self.payment_error_message = message
        self.status = OrderStatus.CANCELLED


@dataclass
class Payment:
    order_id: str
    amount: float
    id: str = field(default_factory=_new_id)
    status: PaymentStatus = PaymentStatus.PENDING
    attempts: int = 0
    last_error_code: Optional[str] = None
    last_error_message: Optional[str] = None
    gateway_raw_response: Optional[dict] = None
    external_id: Optional[str] = None

    def __post_init__(self) -> None:
        if self.amount <= 0:
            raise ValueError("Amount must be greater than 0")

    def mark_as_paid(self, external_id: str, raw_response: Optional[dict]) -> None:
        if self.status != PaymentStatus.PENDING:
            raise ValueError("Payment is not pending")
        self.status = PaymentStatus.PAID
        self.external_id = external_id
        self.gateway_raw_response = raw_response
        self.last_error_code = None
        self.last_error_message = None

    def mark_as_failed(self, error_code: str, error_message: str, raw_response: Optional[dict]) -> None:
        if self.status != PaymentStatus.PENDING:
            raise ValueError("Payment must be in pending status to be failed")
        self.status = PaymentStatus.FAILED
        self.last_error_code = error_code
        self.last_error_message = error_message
        if raw_response is not None:
            self.gateway_raw_response = raw_response
