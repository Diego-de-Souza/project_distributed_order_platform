from __future__ import annotations

from fastapi import FastAPI

from app.config import settings
from app.infrastructure.db import create_all_tables
from app.presentation.error_handlers import register_error_handlers
from app.presentation.middleware import CorrelationIdMiddleware, IdempotencyKeyMiddleware
from app.presentation.routers import clients, orders, payments, products, stock

app = FastAPI(title="Distributed Order Platform - Python API")

app.add_middleware(IdempotencyKeyMiddleware)
app.add_middleware(CorrelationIdMiddleware)

register_error_handlers(app)

app.include_router(clients.router)
app.include_router(products.router)
app.include_router(stock.router)
app.include_router(orders.router)
app.include_router(payments.router)


@app.on_event("startup")
async def on_startup() -> None:
    # ponytail: ddl-auto na mão (create_all), igual ao hibernate.ddl-auto=update
    # da API Java -- suficiente pro alcance didático, sem Alembic.
    await create_all_tables()


@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "UP"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.app_port, reload=True)
