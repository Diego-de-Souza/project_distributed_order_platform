from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.application import commands, queries
from app.application.ports import CacheStore, ProductRepository, StockRepository
from app.presentation.deps import get_cache_store, get_product_repository, get_stock_repository
from app.presentation.mappers import to_product_response
from app.presentation.schemas import CreateProductRequest, ProductResponse

router = APIRouter(prefix="/products", tags=["products"])


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    body: CreateProductRequest,
    products: ProductRepository = Depends(get_product_repository),
    stocks: StockRepository = Depends(get_stock_repository),
) -> ProductResponse:
    product = await commands.create_product(body.sku, body.name, body.price, body.initial_stock, products, stocks)
    return to_product_response(product)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    products: ProductRepository = Depends(get_product_repository),
    cache: CacheStore = Depends(get_cache_store),
) -> ProductResponse:
    product = await queries.get_product(product_id, products, cache)
    return to_product_response(product)
