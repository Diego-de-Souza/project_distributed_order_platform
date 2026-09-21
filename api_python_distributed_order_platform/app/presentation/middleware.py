"""Dois middlewares, mesmo papel dos filters da API Java:

CorrelationIdMiddleware -- carimba (ou repassa) um X-Correlation-Id em toda
requisição/resposta, pra rastrear uma chamada nos logs.

IdempotencyKeyMiddleware -- só nas rotas de escrita sensíveis (criar pedido,
criar pagamento). Usa SET NX (RedisIdempotencyStore.try_start) pra garantir
que, se o cliente reenviar a mesma Idempotency-Key (ex: depois de um timeout
de rede), a segunda chamada não repete o efeito colateral: ou devolve a
resposta já registrada, ou (se a primeira ainda está em andamento) devolve
409 pedindo pra tentar de novo depois.
"""
from __future__ import annotations

import json
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.infrastructure.cache import RedisIdempotencyStore
from app.presentation.deps import get_redis

_IDEMPOTENT_ROUTES = {("POST", "/orders"), ("POST", "/payments")}
_IDEMPOTENCY_TTL_SECONDS = 86400


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        correlation_id = request.headers.get("X-Correlation-Id") or str(uuid.uuid4())
        request.state.correlation_id = correlation_id
        response = await call_next(request)
        response.headers["X-Correlation-Id"] = correlation_id
        return response


class IdempotencyKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if (request.method, request.url.path) not in _IDEMPOTENT_ROUTES:
            return await call_next(request)

        key = request.headers.get("Idempotency-Key")
        if not key:
            return await call_next(request)

        store = RedisIdempotencyStore(get_redis())

        cached = await store.get(key)
        if cached is not None:
            return JSONResponse(status_code=cached["statusCode"], content=cached["body"])

        if not await store.try_start(key, _IDEMPOTENCY_TTL_SECONDS):
            return JSONResponse(
                status_code=409,
                content={"message": "Request with this idempotency key is already in progress"},
            )

        response = await call_next(request)
        body = b"".join([chunk async for chunk in response.body_iterator])

        if response.status_code < 500:
            try:
                await store.complete(key, response.status_code, json.loads(body), _IDEMPOTENCY_TTL_SECONDS)
            except (json.JSONDecodeError, UnicodeDecodeError):
                await store.release(key)
        else:
            await store.release(key)

        headers = {k: v for k, v in response.headers.items() if k.lower() != "content-length"}
        return Response(content=body, status_code=response.status_code, headers=headers, media_type=response.media_type)
