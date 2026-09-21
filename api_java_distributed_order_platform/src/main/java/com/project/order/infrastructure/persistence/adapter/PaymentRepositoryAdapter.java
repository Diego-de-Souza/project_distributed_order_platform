package com.project.order.infrastructure.persistence.adapter;

import com.project.order.application.exception.NotFoundException;
import com.project.order.application.port.PaymentRepository;
import com.project.order.domain.model.Money;
import com.project.order.domain.model.Payment;
import com.project.order.infrastructure.persistence.entity.PaymentJpaEntity;
import com.project.order.infrastructure.persistence.repository.PaymentJpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class PaymentRepositoryAdapter implements PaymentRepository {

    private final PaymentJpaRepository jpaRepository;

    public PaymentRepositoryAdapter(PaymentJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Payment create(Payment payment) {
        PaymentJpaEntity saved = jpaRepository.save(new PaymentJpaEntity(
                payment.getId(), payment.getOrderId(), payment.getAmount().getValue(), payment.getStatus(),
                payment.getAttempts(), payment.getLastErrorCode(), payment.getLastErrorMessage(),
                payment.getGatewayRawResponse(), payment.getExternalId()
        ));
        return toDomain(saved);
    }

    @Override
    public Optional<Payment> findById(String id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Payment update(Payment payment) {
        PaymentJpaEntity entity = jpaRepository.findById(payment.getId())
                .orElseThrow(() -> new NotFoundException("Payment not found: " + payment.getId()));
        entity.setStatus(payment.getStatus());
        entity.setLastErrorCode(payment.getLastErrorCode());
        entity.setLastErrorMessage(payment.getLastErrorMessage());
        entity.setGatewayRawResponse(payment.getGatewayRawResponse());
        entity.setExternalId(payment.getExternalId());
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public void delete(String id) {
        jpaRepository.deleteById(id);
    }

    private Payment toDomain(PaymentJpaEntity entity) {
        return new Payment(entity.getId(), entity.getOrderId(), new Money(entity.getAmount()), entity.getStatus(),
                entity.getAttempts(), entity.getLastErrorCode(), entity.getLastErrorMessage(),
                entity.getGatewayRawResponse(), entity.getExternalId());
    }
}
