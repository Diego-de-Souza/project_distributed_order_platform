package com.project.order.application.port;

import com.project.order.shared.interfaces.GatewayResult;

public interface PaymentGatewayRepository {
    GatewayResult createCharge(String paymentId, String orderId, double amount, String idempotencyKey);
    GatewayResult retrieveCharge(String idempotencyKey, String externalId);
}
