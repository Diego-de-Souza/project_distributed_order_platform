"""DTOs Pydantic. Mesmo contrato REST das APIs Java/NestJS: JSON em
camelCase (por isso o alias em cada campo), Python em snake_case por baixo.
`populate_by_name=True` deixa aceitar os dois lados na entrada; FastAPI já
serializa a saída usando os aliases por padrão."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class _Camel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


# --------------------------------------------------------------- Client --

class CreateClientRequest(_Camel):
    name: str
    email: str


class ClientResponse(_Camel):
    id: str
    name: str
    email: str
    status: str
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


# -------------------------------------------------------------- Product --

class CreateProductRequest(_Camel):
    sku: str
    name: str
    price: float
    initial_stock: int = Field(alias="initialStock")


class ProductResponse(_Camel):
    id: str
    sku: str
    name: str
    price: float
    status: str


# ---------------------------------------------------------------- Stock --

class UpdateStockRequest(_Camel):
    available_quantity: int = Field(alias="availableQuantity")
    reserved_quantity: Optional[int] = Field(default=None, alias="reservedQuantity")


class StockQuantityRequest(_Camel):
    quantity: int


class StockResponse(_Camel):
    product_id: str = Field(alias="productId")
    available_quantity: int = Field(alias="availableQuantity")
    reserved_quantity: int = Field(alias="reservedQuantity")
    version: int


# ---------------------------------------------------------------- Order --

class OrderItemRequestSchema(_Camel):
    product_id: str = Field(alias="productId")
    quantity: int


class CreateOrderRequest(_Camel):
    client_id: str = Field(alias="clientId")
    items: list[OrderItemRequestSchema]


class OrderItemResponse(_Camel):
    product_id: str = Field(alias="productId")
    quantity: int
    unit_price: float = Field(alias="unitPrice")
    subtotal: float


class OrderResponse(_Camel):
    id: str
    client_id: str = Field(alias="clientId")
    items: list[OrderItemResponse]
    status: str
    total: float
    payment_error_code: Optional[str] = Field(default=None, alias="paymentErrorCode")
    payment_error_message: Optional[str] = Field(default=None, alias="paymentErrorMessage")
    version: int


# -------------------------------------------------------------- Payment --

class CreatePaymentRequest(_Camel):
    order_id: str = Field(alias="orderId")
    amount: Optional[float] = None


class PaymentResponse(_Camel):
    id: str
    order_id: str = Field(alias="orderId")
    amount: float
    status: str
    attempts: int
    last_error_code: Optional[str] = Field(default=None, alias="lastErrorCode")
    last_error_message: Optional[str] = Field(default=None, alias="lastErrorMessage")
    external_id: Optional[str] = Field(default=None, alias="externalId")


# ---------------------------------------------------------------- Error --

class ErrorResponse(_Camel):
    status_code: int = Field(alias="statusCode")
    timestamp: datetime
    path: str
    message: str
