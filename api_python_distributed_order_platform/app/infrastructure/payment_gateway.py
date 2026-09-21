"""Gateway de pagamento falso, mesmo espírito do StubPaymentGateway.java e
do stub-payment.gateway.ts do Nest: decide o resultado pelos centavos do
valor, pra dar cenários determinísticos em teste e demo.

Centavos == 13 -> recusa de negócio (não repetível).
Centavos == 66 -> timeout do lado do cliente: o gateway processou com
sucesso, só a resposta que não voltou a tempo -- por isso o create_charge
levanta GatewayError (retriable) mas já deixa o resultado real disponível
pra quem consultar via retrieve_charge. É a lição de idempotência: nunca
cobrar de novo às cegas, sempre checar o que realmente aconteceu primeiro.
Qualquer outro valor -> aprovado na hora.
"""
from __future__ import annotations

import uuid
from typing import Any

from app.domain.exceptions import GatewayError


class StubPaymentGateway:
    def __init__(self) -> None:
        self._results: dict[str, dict[str, Any]] = {}

    async def create_charge(self, payment_id: str, order_id: str, amount: float, idempotency_key: str) -> dict[str, Any]:
        cents = round(amount * 100) % 100

        if cents == 13:
            result = {
                "success": False, "kind": "BUSINESS",
                "error_code": "CARD_DECLINED", "error_message": "Card was declined",
                "raw": {"status": "declined"},
            }
            self._results[idempotency_key] = result
            return result

        external_id = str(uuid.uuid4())
        result = {
            "success": True, "kind": "SUCCESS", "external_id": external_id,
            "raw": {"status": "approved", "external_id": external_id},
        }
        self._results[idempotency_key] = result

        if cents == 66:
            raise GatewayError("Gateway timeout")
        return result

    async def retrieve_charge(self, idempotency_key: str) -> dict[str, Any]:
        return self._results.get(idempotency_key, {
            "success": False, "kind": "RETRIABLE",
            "error_code": "GATEWAY_UNAVAILABLE", "error_message": "Charge not found",
        })
