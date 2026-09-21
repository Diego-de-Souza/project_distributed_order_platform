package com.project.order.application.usecase.product;

import com.project.order.application.exception.ConflictException;
import com.project.order.application.port.ProductRepository;
import com.project.order.application.port.StockRepository;
import com.project.order.domain.model.Product;
import com.project.order.domain.model.Stock;
import org.springframework.stereotype.Service;

@Service
public class CreateProductUseCase {

    private final ProductRepository productRepository;
    private final StockRepository stockRepository;

    public CreateProductUseCase(ProductRepository productRepository, StockRepository stockRepository) {
        this.productRepository = productRepository;
        this.stockRepository = stockRepository;
    }

    public Product execute(String sku, String name, double price, int initialStock) {
        if (productRepository.findBySku(sku).isPresent()) {
            throw new ConflictException("Product with this SKU already exists");
        }

        Product created = productRepository.create(Product.create(sku, name, price));

        stockRepository.create(Stock.create(created.getId(), initialStock, 0));

        return created;
    }
}
