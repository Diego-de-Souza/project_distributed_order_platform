package com.project.order.infrastructure.persistence.entity;

import com.project.order.domain.model.ProductStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "products")
public class ProductJpaEntity {

    @Id
    private String id;

    @Column(unique = true)
    private String sku;

    private String name;

    private double price;

    @Enumerated(EnumType.STRING)
    private ProductStatus status;

    protected ProductJpaEntity() {
        // JPA
    }

    public ProductJpaEntity(String id, String sku, String name, double price, ProductStatus status) {
        this.id = id;
        this.sku = sku;
        this.name = name;
        this.price = price;
        this.status = status;
    }

    public String getId() { return id; }
    public String getSku() { return sku; }
    public String getName() { return name; }
    public double getPrice() { return price; }
    public ProductStatus getStatus() { return status; }
}
