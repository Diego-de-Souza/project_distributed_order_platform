package com.project.order.application.port;

import com.project.order.domain.model.Order;
import com.project.order.domain.model.Payment;
import com.project.order.domain.model.Stock;

public interface EventPublisherRepository {
    void publishCreatedOrder(Order order);
    void publishConfirmedOrder(Order order);
    void publishCancelledOrder(Order order);
    void publishPaymentPaid(Payment payment);
    void publishPaymentFailed(Payment payment);
    void publishStockReserved(Stock stock);
    void publishStockReleased(Stock stock);
    void publishStockConsumed(Stock stock);
}
