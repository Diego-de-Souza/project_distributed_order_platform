package com.project.order.presentation.http.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class OrderDto {

    public record CreateOrderItemRequest(
            @NotBlank(message = "productId is required") String productId,
            @NotNull @Min(value = 1, message = "Quantity must be greater than 0")
            @Max(value = 100, message = "Quantity must be less than 100") Integer quantity
    ) {}

    public record CreateOrderRequest(
            @NotBlank(message = "clientId is required") String clientId,
            @NotEmpty(message = "Order must have at least one item") @Valid List<CreateOrderItemRequest> items
    ) {}

    public record OrderItemResponse(String productId, int quantity, double unitPrice, double subtotal) {}

    public record OrderResponse(
            String id,
            String clientId,
            String status,
            double total,
            int version,
            List<OrderItemResponse> items
    ) {}
}
