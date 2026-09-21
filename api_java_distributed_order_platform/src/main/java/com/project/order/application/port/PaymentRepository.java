package com.project.order.application.port;

import com.project.order.domain.model.Payment;

import java.util.Optional;

public interface PaymentRepository {
    Payment create(Payment payment);
    Optional<Payment> findById(String id);
    Payment update(Payment payment);
    void delete(String id);
}
