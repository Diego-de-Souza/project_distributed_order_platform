package com.project.order.application.usecase.stock;

import com.project.order.application.exception.NotFoundException;
import com.project.order.application.port.StockRepository;
import com.project.order.domain.model.Stock;
import org.springframework.stereotype.Service;

@Service
public class GetStockUseCase {

    private final StockRepository stockRepository;

    public GetStockUseCase(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    public Stock execute(String productId) {
        return stockRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Stock not found"));
    }
}
