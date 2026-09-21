package com.project.order.infrastructure.persistence.repository;

import com.project.order.infrastructure.persistence.entity.ProductJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductJpaRepository extends JpaRepository<ProductJpaEntity, String> {
    Optional<ProductJpaEntity> findBySku(String sku);
}
