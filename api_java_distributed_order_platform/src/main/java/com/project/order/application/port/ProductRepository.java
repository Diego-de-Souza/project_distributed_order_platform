package com.project.order.application.port;

import com.project.order.domain.model.Product;

import java.util.List;
import java.util.Optional;

public interface ProductRepository {
    Product create(Product product);
    Optional<Product> findById(String id);
    Optional<Product> findBySku(String sku);
    List<Product> findAll();
    Product update(Product product);
    void delete(String id);
}
