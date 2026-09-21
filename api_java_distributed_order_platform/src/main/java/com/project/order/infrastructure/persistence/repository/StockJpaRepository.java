package com.project.order.infrastructure.persistence.repository;

import com.project.order.infrastructure.persistence.entity.StockJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockJpaRepository extends JpaRepository<StockJpaEntity, String> {
}
