package com.project.order.application.usecase.order;

import com.project.order.application.exception.NotFoundException;
import com.project.order.application.port.OrderRepository;
import com.project.order.domain.model.Order;
import org.springframework.stereotype.Service;

@Service
public class GetOrderUseCase {

    private final OrderRepository orderRepository;

    public GetOrderUseCase(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Order execute(String orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
    }
}
