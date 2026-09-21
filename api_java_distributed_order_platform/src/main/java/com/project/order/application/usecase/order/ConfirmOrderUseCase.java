package com.project.order.application.usecase.order;

import com.project.order.application.exception.BusinessRuleException;
import com.project.order.application.exception.NotFoundException;
import com.project.order.application.port.EventPublisherRepository;
import com.project.order.application.port.OrderRepository;
import com.project.order.domain.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfirmOrderUseCase {

    private static final Logger log = LoggerFactory.getLogger(ConfirmOrderUseCase.class);

    private final OrderRepository orderRepository;
    private final EventPublisherRepository eventPublisher;

    public ConfirmOrderUseCase(OrderRepository orderRepository, EventPublisherRepository eventPublisher) {
        this.orderRepository = orderRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public Order execute(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        try {
            order.confirmOrder();
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException(e.getMessage());
        }

        orderRepository.update(order);

        try {
            eventPublisher.publishConfirmedOrder(order);
        } catch (Exception e) {
            log.error("Failed to publish OrderConfirmed for order {}", order.getId(), e);
        }

        return order;
    }
}
