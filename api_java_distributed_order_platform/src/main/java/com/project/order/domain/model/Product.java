package com.project.order.domain.model;

import java.util.UUID;

public class Product {
    private final String id;
    private final String sku;
    private final String name;
    private final Money price;
    private ProductStatus status;

    public Product(String id, String sku, String name, Money price, ProductStatus status) {
        if (sku == null || sku.isBlank()) {
            throw new IllegalArgumentException("SKU is required");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (price == null || price.getValue() <= 0) {
            throw new IllegalArgumentException("Price must be greater than 0");
        }
        this.id = id;
        this.sku = sku;
        this.name = name;
        this.price = price;
        this.status = status != null ? status : ProductStatus.ACTIVE;
    }

    public static Product create(String sku, String name, double price) {
        return new Product(UUID.randomUUID().toString(), sku, name, new Money(price), ProductStatus.ACTIVE);
    }

    public boolean canBeOrdered() {
        return this.status == ProductStatus.ACTIVE;
    }

    public String getId() {
        return this.id;
    }

    public String getSku() {
        return this.sku;
    }

    public String getName() {
        return this.name;
    }

    public Money getPrice() {
        return this.price;
    }

    public ProductStatus getStatus() {
        return this.status;
    }
}
