package com.project.order.application.usecase.payment;

import com.project.order.application.exception.BusinessRuleException;
import com.project.order.application.exception.NotFoundException;
import com.project.order.application.port.EventPublisherRepository;
import com.project.order.application.port.OrderRepository;
import com.project.order.application.port.PaymentGatewayRepository;
import com.project.order.application.port.PaymentRepository;
import com.project.order.application.port.UnitOfWorkRepository;
import com.project.order.domain.model.Order;
import com.project.order.domain.model.OrderStatus;
import com.project.order.domain.model.Payment;
import com.project.order.domain.model.Stock;
import com.project.order.shared.interfaces.GatewayResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Igual ao CreatePaymentUseCase do NestJS: a chamada ao gateway acontece
 * FORA de qualquer transação de banco (I/O externo não deve segurar uma
 * conexão/transação aberta). Por isso aqui a gente usa o UnitOfWorkRepository
 * manual (begin/commit/rollback) só depois que o resultado do gateway já
 * voltou, em vez de um único método @Transactional cobrindo tudo.
 */
@Service
public class CreatePaymentUseCase {

    private static final Logger log = LoggerFactory.getLogger(CreatePaymentUseCase.class);
    private static final int MAX_RETRIES = 3;

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final UnitOfWorkRepository unitOfWork;
    private final PaymentGatewayRepository gateway;
    private final EventPublisherRepository eventPublisher;

    public CreatePaymentUseCase(
            PaymentRepository paymentRepository,
            OrderRepository orderRepository,
            UnitOfWorkRepository unitOfWork,
            PaymentGatewayRepository gateway,
            EventPublisherRepository eventPublisher
    ) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.unitOfWork = unitOfWork;
        this.gateway = gateway;
        this.eventPublisher = eventPublisher;
    }

    public Payment execute(String orderId, Double requestedAmount) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BusinessRuleException("Order is not pending");
        }
        if (order.getItems().isEmpty()) {
            throw new BusinessRuleException("Order has no items");
        }
        if (requestedAmount != null && !requestedAmount.equals(order.getTotal().getValue())) {
            throw new BusinessRuleException("Payment amount does not match order total");
        }

        Payment payment = paymentRepository.create(Payment.create(order.getId(), order.getTotal().getValue()));
        String idempotencyKey = payment.getId();

        GatewayResult gatewayResult = chargeWithRetry(payment, idempotencyKey);

        unitOfWork.begin();
        try {
            if (gatewayResult.success()) {
                for (var item : order.getItems()) {
                    Stock stock = unitOfWork.getStockRepository().findById(item.getProductId())
                            .orElseThrow(() -> new NotFoundException("Stock not found for product " + item.getProductId()));
                    stock.consume(item.getQuantity());
                    unitOfWork.getStockRepository().update(stock);
                    publishQuietly(() -> eventPublisher.publishStockConsumed(stock), "StockConsumed", stock.getProductId());
                }

                payment.markAsPaid(
                        gatewayResult.externalId() != null ? gatewayResult.externalId() : idempotencyKey,
                        gatewayResult.raw()
                );
                order.confirmOrder();
            } else {
                String code = gatewayResult.errorCode() != null ? gatewayResult.errorCode() : "GATEWAY_ERROR";
                String message = gatewayResult.errorMessage() != null ? gatewayResult.errorMessage() : "Payment failed";

                payment.markAsFailed(code, message, gatewayResult.raw());
                order.registerPaymentFailure(code, message);

                for (var item : order.getItems()) {
                    Stock stock = unitOfWork.getStockRepository().findById(item.getProductId())
                            .orElseThrow(() -> new NotFoundException("Stock not found for product " + item.getProductId()));
                    stock.release(item.getQuantity());
                    unitOfWork.getStockRepository().update(stock);
                    publishQuietly(() -> eventPublisher.publishStockReleased(stock), "StockReleased", stock.getProductId());
                }
            }

            unitOfWork.getPaymentRepository().update(payment);
            unitOfWork.getOrderRepository().update(order);
            unitOfWork.commit();
        } catch (RuntimeException e) {
            safeRollback();
            publishQuietly(() -> eventPublisher.publishPaymentFailed(payment), "PaymentFailed", payment.getId());
            throw e;
        }

        if (gatewayResult.success()) {
            publishQuietly(() -> eventPublisher.publishPaymentPaid(payment), "PaymentPaid", payment.getId());
        } else {
            publishQuietly(() -> eventPublisher.publishPaymentFailed(payment), "PaymentFailed", payment.getId());
        }

        return payment;
    }

    private GatewayResult chargeWithRetry(Payment payment, String idempotencyKey) {
        try {
            GatewayResult result = gateway.createCharge(payment.getId(), payment.getOrderId(), payment.getAmount().getValue(), idempotencyKey);
            if (result.success() || "BUSINESS".equals(result.kind())) {
                return result;
            }
            return retryRetrieve(idempotencyKey);
        } catch (RuntimeException e) {
            if (!isRetriable(e)) {
                return new GatewayResult(false, null, "failed", "PAYMENT_REJECTED", e.getMessage(), "BUSINESS", null);
            }
            return retryRetrieve(idempotencyKey);
        }
    }

    private GatewayResult retryRetrieve(String idempotencyKey) {
        GatewayResult lastResult = new GatewayResult(false, null, "pending", "GATEWAY_UNAVAILABLE", "Gateway unavailable after retries", "RETRIABLE", null);

        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            sleep(attempt * 500L);
            try {
                lastResult = gateway.retrieveCharge(idempotencyKey, null);
                if (lastResult.success() || "BUSINESS".equals(lastResult.kind())) {
                    return lastResult;
                }
            } catch (RuntimeException e) {
                boolean retriable = isRetriable(e);
                lastResult = new GatewayResult(false, null, "failed",
                        retriable ? "GATEWAY_UNAVAILABLE" : "PAYMENT_REJECTED",
                        e.getMessage(), retriable ? "RETRIABLE" : "BUSINESS", null);
                if (!retriable) {
                    return lastResult;
                }
            }
        }
        return lastResult;
    }

    private boolean isRetriable(RuntimeException e) {
        String message = e.getMessage() == null ? "" : e.getMessage().toLowerCase();
        return message.contains("etimedout") || message.contains("econnreset") || message.contains("enotfound")
                || message.contains("timeout") || message.contains("socket") || message.contains("network")
                || message.contains("502") || message.contains("503") || message.contains("504");
    }

    private void safeRollback() {
        try {
            unitOfWork.rollback();
        } catch (Exception ignored) {
            // ponytail: melhor esforço, transação já pode ter sido finalizada
        }
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private void publishQuietly(Runnable action, String eventName, String subjectId) {
        try {
            action.run();
        } catch (Exception e) {
            log.error("Failed to publish {} for {}", eventName, subjectId, e);
        }
    }
}
