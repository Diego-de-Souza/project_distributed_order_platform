package com.project.order.presentation.http.mapper;

import com.project.order.domain.model.Payment;
import com.project.order.presentation.http.dto.PaymentDto.PaymentResponse;

public class PaymentMapper {

    private PaymentMapper() {}

    public static PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrderId(),
                payment.getAmount().getValue(),
                payment.getStatus().name(),
                payment.getAttempts(),
                payment.getLastErrorCode(),
                payment.getLastErrorMessage(),
                payment.getExternalId()
        );
    }
}
