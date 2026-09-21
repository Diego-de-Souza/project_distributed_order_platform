from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.application import commands, queries
from app.application.commands import OrderItemRequest
from app.application.events import EventBus
from app.application.ports import ClientRepository, OrderRepository, ProductRepository, StockRepository
from app.presentation.deps import (
    get_client_repository, get_event_bus, get_order_repository, get_product_repository, get_stock_repository,
)
from app.presentation.mappers import to_order_response
from app.presentation.schemas import CreateOrderRequest, OrderResponse

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    body: CreateOrderRequest,
    clients: ClientRepository = Depends(get_client_repository),
    products: ProductRepository = Depends(get_product_repository),
    stocks: StockRepository = Depends(get_stock_repository),
    orders: OrderRepository = Depends(get_order_repository),
    events: EventBus = Depends(get_event_bus),
) -> OrderResponse:
    items = [OrderItemRequest(product_id=i.product_id, quantity=i.quantity) for i in body.items]
    order = await commands.create_order(body.client_id, items, clients, products, stocks, orders, events)
    return to_order_response(order)


@router.get("", response_model=list[OrderResponse])
async def list_orders(orders: OrderRepository = Depends(get_order_repository)) -> list[OrderResponse]:
    result = await queries.list_orders(orders)
    return [to_order_response(o) for o in result]


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, orders: OrderRepository = Depends(get_order_repository)) -> OrderResponse:
    order = await queries.get_order(order_id, orders)
    return to_order_response(order)


@router.post("/{order_id}/confirm", response_model=OrderResponse)
async def confirm_order(
    order_id: str, orders: OrderRepository = Depends(get_order_repository), events: EventBus = Depends(get_event_bus)
) -> OrderResponse:
    order = await commands.confirm_order(order_id, orders, events)
    return to_order_response(order)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: str,
    orders: OrderRepository = Depends(get_order_repository),
    stocks: StockRepository = Depends(get_stock_repository),
    events: EventBus = Depends(get_event_bus),
) -> OrderResponse:
    order = await commands.cancel_order(order_id, orders, stocks, events)
    return to_order_response(order)
