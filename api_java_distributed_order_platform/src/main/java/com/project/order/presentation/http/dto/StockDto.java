package com.project.order.presentation.http.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class StockDto {

    public record UpdateStockRequest(
            @NotNull @Min(value = 0, message = "Available quantity must be greater than or equal to 0") Integer availableQuantity,
            @Min(value = 0, message = "Reserved quantity must be greater than or equal to 0") Integer reservedQuantity
    ) {}

    public record StockQuantityRequest(
            @NotNull @Min(value = 1, message = "Quantity must be greater than 0") Integer quantity
    ) {}

    public record StockResponse(
            String productId,
            int availableQuantity,
            int reservedQuantity,
            int version
    ) {}
}
