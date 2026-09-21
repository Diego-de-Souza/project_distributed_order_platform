package com.project.order.presentation.http.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class ProductDto {

    public record CreateProductRequest(
            @NotBlank(message = "SKU is required") String sku,
            @NotBlank(message = "Name is required") String name,
            @Positive(message = "Price must be greater than 0") double price,
            @Min(value = 0, message = "Initial stock must be greater than or equal to 0") Integer initialStock
    ) {}

    public record ProductResponse(
            String id,
            String sku,
            String name,
            double price,
            String status
    ) {}
}
