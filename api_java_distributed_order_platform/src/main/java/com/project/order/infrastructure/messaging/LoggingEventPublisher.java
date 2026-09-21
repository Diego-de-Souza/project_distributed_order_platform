package com.project.order.infrastructure.messaging;

import com.project.order.application.port.EventPublisherRepository;
import com.project.order.domain.model.Order;
import com.project.order.domain.model.Payment;
import com.project.order.domain.model.Stock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * O Fase 3 (Java/DDD) não pede RabbitMQ — isso é escopo do Fase 5
 * (Engenharia distribuída), compartilhado entre as três APIs. Mas o port
 * EventPublisherRepository já existe (o domínio publica eventos), então
 * esta implementação cumpre o contrato sem inventar infraestrutura de fila
 * que ainda não tem consumidor nenhum.
 *
 * ponytail: só loga o evento, teto conhecido; trocar por um publisher
 * RabbitMQ real (igual ao rabbitmq-event.publish.ts do NestJS) quando a
 * mensageria entrar em cena.
 */
@Component
public class LoggingEventPublisher implements EventPublisherRepository {

    private static final Logger log = LoggerFactory.getLogger(LoggingEventPublisher.class);

    @Override
    public void publishCreatedOrder(Order order) {
        log.info("[event] order.created id={}", order.getId());
    }

    @Override
    public void publishConfirmedOrder(Order order) {
        log.info("[event] order.confirmed id={}", order.getId());
    }

    @Override
    public void publishCancelledOrder(Order order) {
        log.info("[event] order.cancelled id={}", order.getId());
    }

    @Override
    public void publishPaymentPaid(Payment payment) {
        log.info("[event] payment.paid id={}", payment.getId());
    }

    @Override
    public void publishPaymentFailed(Payment payment) {
        log.info("[event] payment.failed id={}", payment.getId());
    }

    @Override
    public void publishStockReserved(Stock stock) {
        log.info("[event] stock.reserved productId={}", stock.getProductId());
    }

    @Override
    public void publishStockReleased(Stock stock) {
        log.info("[event] stock.released productId={}", stock.getProductId());
    }

    @Override
    public void publishStockConsumed(Stock stock) {
        log.info("[event] stock.consumed productId={}", stock.getProductId());
    }
}
