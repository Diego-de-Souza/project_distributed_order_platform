"""Traduz exceção de domínio -> HTTP, no mesmo formato de corpo do
GlobalExceptionHandler da API Java: {statusCode, timestamp, path, message}."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.domain.exceptions import BusinessRuleError, ConflictError, DomainError, GatewayError, NotFoundError

_STATUS_BY_ERROR = {
    NotFoundError: 404,
    BusinessRuleError: 400,
    ConflictError: 409,
    GatewayError: 502,
}


def _body(status_code: int, request: Request, message: str) -> dict:
    return {
        "statusCode": status_code,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "path": request.url.path,
        "message": message,
    }


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
        status_code = _STATUS_BY_ERROR.get(type(exc), 400)
        return JSONResponse(status_code=status_code, content=_body(status_code, request, str(exc)))

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(status_code=500, content=_body(500, request, "Internal server error"))
