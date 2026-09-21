package com.project.order.presentation.http.mapper;

import com.project.order.domain.model.Order;
import com.project.order.presentation.http.dto.OrderDto.OrderItemResponse;
import com.project.order.presentation.http.dto.OrderDto.OrderResponse;

public class OrderMapper {

    private OrderMapper() {}

    public static OrderResponse toResponse(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getClientId(),
                order.getStatus().name(),
                order.getTotal().getValue(),
                order.getVersion(),
                order.getItems().stream()
                        .map(item -> new OrderItemResponse(
                                item.getProductId(),
                                item.getQuantity(),
                                item.getUnitPrice().getValue(),
                                item.getSubTotal().getValue()
                        ))
                        .toList()
        );
    }
}
