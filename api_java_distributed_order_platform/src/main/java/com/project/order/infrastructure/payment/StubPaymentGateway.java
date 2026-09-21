package com.project.order.infrastructure.payment;

import com.project.order.application.exception.GatewayException;
import com.project.order.application.port.PaymentGatewayRepository;
import com.project.order.shared.interfaces.GatewayResult;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Espelha o StubPaymentGateway do NestJS: sem chamar nenhuma API de
 * verdade, usa os centavos do valor pra simular os três cenários (timeout,
 * cartão recusado, sucesso), guardando o resultado por idempotencyKey pra
 * que um retry devolva sempre a mesma resposta.
 */
@Component
public class StubPaymentGateway implements PaymentGatewayRepository {

    private final Map<String, GatewayResult> charges = new ConcurrentHashMap<>();

    @Override
    public GatewayResult createCharge(String paymentId, String orderId, double amount, String idempotencyKey) {
        GatewayResult existing = charges.get(idempotencyKey);
        if (existing != null) {
            return existing;
        }

        int cents = (int) Math.round((amount % 1) * 100);

        if (cents == 13) {
            throw new GatewayException("ETIMEDOUT: gateway connection timeout");
        }

        if (cents == 99) {
            GatewayResult failed = new GatewayResult(false, null, "failed", "card_declined", "Card was declined", "BUSINESS",
                    Map.of("reason", "card_declined"));
            charges.put(idempotencyKey, failed);
            return failed;
        }

        GatewayResult paid = new GatewayResult(true, "stub_" + UUID.randomUUID(), "paid", null, null, null,
                Map.of("paymentId", paymentId, "orderId", orderId, "amount", amount));
        charges.put(idempotencyKey, paid);
        return paid;
    }

    @Override
    public GatewayResult retrieveCharge(String idempotencyKey, String externalId) {
        GatewayResult existing = charges.get(idempotencyKey);
        if (existing != null) {
            return existing;
        }
        return new GatewayResult(false, null, "pending", "CHARGE_NOT_FOUND", "Charge not found yet", "RETRIABLE", null);
    }
}
