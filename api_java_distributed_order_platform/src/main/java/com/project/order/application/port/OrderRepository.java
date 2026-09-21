package com.project.order.application.port;

import com.project.order.domain.model.Order;

import java.util.List;
import java.util.Optional;

public interface OrderRepository {
    Order create(Order order);
    Optional<Order> findById(String id);
    List<Order> findAll();
    Order update(Order order);
    void delete(String id);
}
