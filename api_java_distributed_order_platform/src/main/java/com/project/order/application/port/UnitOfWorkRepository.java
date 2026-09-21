package com.project.order.application.port;

public interface UnitOfWorkRepository {
    void begin();
    void commit();
    void rollback();

    PaymentRepository getPaymentRepository();
    OrderRepository getOrderRepository();
    StockRepository getStockRepository();
}
