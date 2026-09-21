package com.project.order.presentation.http.mapper;

import com.project.order.domain.model.Product;
import com.project.order.presentation.http.dto.ProductDto.ProductResponse;

public class ProductMapper {

    private ProductMapper() {}

    public static ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getPrice().getValue(),
                product.getStatus().name()
        );
    }
}
