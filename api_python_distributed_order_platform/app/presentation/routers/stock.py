from __future__ import annotations

from fastapi import APIRouter, Depends

from app.application import commands, queries
from app.application.events import EventBus
from app.application.ports import StockRepository
from app.presentation.deps import get_event_bus, get_stock_repository
from app.presentation.mappers import to_stock_response
from app.presentation.schemas import StockQuantityRequest, StockResponse, UpdateStockRequest

router = APIRouter(prefix="/stock", tags=["stock"])


@router.get("/{product_id}", response_model=StockResponse)
async def get_stock(product_id: str, stocks: StockRepository = Depends(get_stock_repository)) -> StockResponse:
    stock = await queries.get_stock(product_id, stocks)
    return to_stock_response(stock)


@router.put("/{product_id}", response_model=StockResponse)
async def update_stock(
    product_id: str, body: UpdateStockRequest, stocks: StockRepository = Depends(get_stock_repository)
) -> StockResponse:
    stock = await commands.update_stock(product_id, body.available_quantity, body.reserved_quantity, stocks)
    return to_stock_response(stock)


@router.post("/{product_id}/reserve", response_model=StockResponse)
async def reserve_stock(
    product_id: str, body: StockQuantityRequest,
    stocks: StockRepository = Depends(get_stock_repository), events: EventBus = Depends(get_event_bus),
) -> StockResponse:
    stock = await commands.reserve_stock(product_id, body.quantity, stocks, events)
    return to_stock_response(stock)


@router.post("/{product_id}/release", response_model=StockResponse)
async def release_stock(
    product_id: str, body: StockQuantityRequest,
    stocks: StockRepository = Depends(get_stock_repository), events: EventBus = Depends(get_event_bus),
) -> StockResponse:
    stock = await commands.release_stock(product_id, body.quantity, stocks, events)
    return to_stock_response(stock)
