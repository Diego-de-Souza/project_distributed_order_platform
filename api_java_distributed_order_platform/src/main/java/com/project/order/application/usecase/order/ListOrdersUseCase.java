package com.project.order.application.usecase.order;

import com.project.order.application.port.OrderRepository;
import com.project.order.domain.model.Order;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ListOrdersUseCase {

    private final OrderRepository orderRepository;

    public ListOrdersUseCase(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public List<Order> execute() {
        return orderRepository.findAll();
    }
}
