"""
Lado de leitura do CQRS: só busca dado, nunca muda estado. Fica livre pra
usar um caminho de acesso diferente do lado de escrita (aqui, cache-aside
em Redis pra Client/Product) sem contaminar os commands.
"""
from __future__ import annotations

from datetime import datetime

from app.application.ports import CacheStore, ClientRepository, OrderRepository, ProductRepository, StockRepository
from app.domain.exceptions import NotFoundError
from app.domain.models import Client, ClientStatus, Order, Product, ProductStatus, Stock

_CLIENT_TTL_SECONDS = 300
_PRODUCT_TTL_SECONDS = 300


async def get_client(client_id: str, clients: ClientRepository, cache: CacheStore) -> Client:
    cache_key = f"client:{client_id}"
    cached = await cache.get(cache_key)
    if cached is not None:
        return Client(
            id=cached["id"], name=cached["name"], email=cached["email"],
            status=ClientStatus(cached["status"]),
            created_at=datetime.fromisoformat(cached["created_at"]),
            updated_at=datetime.fromisoformat(cached["updated_at"]),
        )

    client = await clients.get_by_id(client_id)
    if client is None:
        raise NotFoundError("Client not found")

    await cache.set(cache_key, {
        "id": client.id, "name": client.name, "email": client.email,
        "status": client.status.value,
        "created_at": client.created_at.isoformat(),
        "updated_at": client.updated_at.isoformat(),
    }, _CLIENT_TTL_SECONDS)
    return client


async def list_clients(clients: ClientRepository) -> list[Client]:
    return await clients.list_all()


async def get_product(product_id: str, products: ProductRepository, cache: CacheStore) -> Product:
    cache_key = f"product:{product_id}"
    cached = await cache.get(cache_key)
    if cached is not None:
        return Product(**{**cached, "status": ProductStatus(cached["status"])})

    product = await products.get_by_id(product_id)
    if product is None:
        raise NotFoundError("Product not found")

    await cache.set(cache_key, {
        "id": product.id, "sku": product.sku, "name": product.name,
        "price": product.price, "status": product.status.value,
    }, _PRODUCT_TTL_SECONDS)
    return product


async def get_stock(product_id: str, stocks: StockRepository) -> Stock:
    stock = await stocks.get_by_id(product_id)
    if stock is None:
        raise NotFoundError("Stock not found")
    return stock


async def get_order(order_id: str, orders: OrderRepository) -> Order:
    order = await orders.get_by_id(order_id)
    if order is None:
        raise NotFoundError("Order not found")
    return order


async def list_orders(orders: OrderRepository) -> list[Order]:
    return await orders.list_all()
