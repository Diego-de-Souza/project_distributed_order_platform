package com.project.order.application.port;

import com.project.order.domain.model.Stock;

import java.util.List;
import java.util.Optional;

public interface StockRepository {
    Stock create(Stock stock);
    Optional<Stock> findById(String productId);
    List<Stock> findAll();
    Stock update(Stock stock);
    void delete(String productId);
}
