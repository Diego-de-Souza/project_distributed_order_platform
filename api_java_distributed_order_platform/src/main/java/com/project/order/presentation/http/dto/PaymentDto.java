package com.project.order.presentation.http.dto;

import jakarta.validation.constraints.NotBlank;

public class PaymentDto {

    public record CreatePaymentRequest(
            @NotBlank(message = "order_id is required") String order_id,
            Double amount
    ) {}

    public record PaymentResponse(
            String id,
            String orderId,
            double amount,
            String status,
            int attempts,
            String lastErrorCode,
            String lastErrorMessage,
            String externalId
    ) {}
}
