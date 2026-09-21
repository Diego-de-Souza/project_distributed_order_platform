package com.project.order.infrastructure.persistence.adapter;

import com.project.order.application.port.ProductRepository;
import com.project.order.domain.model.Money;
import com.project.order.domain.model.Product;
import com.project.order.infrastructure.persistence.entity.ProductJpaEntity;
import com.project.order.infrastructure.persistence.repository.ProductJpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class ProductRepositoryAdapter implements ProductRepository {

    private final ProductJpaRepository jpaRepository;

    public ProductRepositoryAdapter(ProductJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Product create(Product product) {
        String id = product.getId() != null ? product.getId() : UUID.randomUUID().toString();
        ProductJpaEntity saved = jpaRepository.save(new ProductJpaEntity(
                id, product.getSku(), product.getName(), product.getPrice().getValue(), product.getStatus()
        ));
        return toDomain(saved);
    }

    @Override
    public Optional<Product> findById(String id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Product> findBySku(String sku) {
        return jpaRepository.findBySku(sku).map(this::toDomain);
    }

    @Override
    public List<Product> findAll() {
        return jpaRepository.findAll().stream().map(this::toDomain).toList();
    }

    @Override
    public Product update(Product product) {
        ProductJpaEntity saved = jpaRepository.save(new ProductJpaEntity(
                product.getId(), product.getSku(), product.getName(), product.getPrice().getValue(), product.getStatus()
        ));
        return toDomain(saved);
    }

    @Override
    public void delete(String id) {
        jpaRepository.deleteById(id);
    }

    private Product toDomain(ProductJpaEntity entity) {
        return new Product(entity.getId(), entity.getSku(), entity.getName(), new Money(entity.getPrice()), entity.getStatus());
    }
}
