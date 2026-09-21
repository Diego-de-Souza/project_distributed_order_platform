package com.project.order.application.usecase.order;

import com.project.order.application.exception.BusinessRuleException;
import com.project.order.application.exception.ConflictException;
import com.project.order.application.exception.NotFoundException;
import com.project.order.application.port.EventPublisherRepository;
import com.project.order.application.port.OrderRepository;
import com.project.order.application.port.StockRepository;
import com.project.order.domain.model.Order;
import com.project.order.domain.model.Stock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CancelOrderUseCase {

    private static final Logger log = LoggerFactory.getLogger(CancelOrderUseCase.class);

    private final OrderRepository orderRepository;
    private final StockRepository stockRepository;
    private final EventPublisherRepository eventPublisher;

    public CancelOrderUseCase(
            OrderRepository orderRepository,
            StockRepository stockRepository,
            EventPublisherRepository eventPublisher
    ) {
        this.orderRepository = orderRepository;
        this.stockRepository = stockRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public Order execute(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        try {
            order.cancelOrder();
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException(e.getMessage());
        }

        for (var item : order.getItems()) {
            Stock stock = stockRepository.findById(item.getProductId())
                    .orElseThrow(() -> new NotFoundException("Stock not found: " + item.getProductId()));
            stock.release(item.getQuantity());
            try {
                stockRepository.update(stock);
            } catch (OptimisticLockingFailureException e) {
                throw new ConflictException("Stock was modified by another request, retry");
            }
            try {
                eventPublisher.publishStockReleased(stock);
            } catch (Exception e) {
                log.error("Failed to publish StockReleased for product {}", stock.getProductId(), e);
            }
        }

        orderRepository.update(order);

        try {
            eventPublisher.publishCancelledOrder(order);
        } catch (Exception e) {
            log.error("Failed to publish OrderCancelled for order {}", order.getId(), e);
        }

        return order;
    }
}
