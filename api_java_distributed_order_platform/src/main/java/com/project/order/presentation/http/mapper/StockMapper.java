package com.project.order.presentation.http.mapper;

import com.project.order.domain.model.Stock;
import com.project.order.presentation.http.dto.StockDto.StockResponse;

public class StockMapper {

    private StockMapper() {}

    public static StockResponse toResponse(Stock stock) {
        return new StockResponse(
                stock.getProductId(),
                stock.getAvailableQuantity(),
                stock.getReservedQuantity(),
                stock.getVersion()
        );
    }
}
