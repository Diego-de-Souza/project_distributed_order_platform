package com.project.order.domain.model;

import java.util.UUID;

public class Stock {
    private final String productId;
    private int availableQuantity;
    private int reservedQuantity;
    private int version;

    public Stock(String productId, int availableQuantity, int reservedQuantity, int version) {
        if (productId == null || productId.isBlank()) {
            throw new IllegalArgumentException("Product ID is required");
        }
        if (availableQuantity < 0) {
            throw new IllegalArgumentException("Available quantity must be greater than or equal to 0");
        }
        if (reservedQuantity < 0) {
            throw new IllegalArgumentException("Reserved quantity must be greater than or equal to 0");
        }
        if (version < 0) {
            throw new IllegalArgumentException("Version must be greater than or equal to 0");
        }
        this.productId = productId;
        this.availableQuantity = availableQuantity;
        this.reservedQuantity = reservedQuantity;
        this.version = version;
    }

    public static Stock create(String productId, int availableQuantity, int reservedQuantity) {
        return new Stock(productId, availableQuantity, reservedQuantity, 0);

    }

    public void reserve(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }
        if (quantity > this.availableQuantity) {
            throw new IllegalArgumentException("Quantity must be less than or equal to available quantity");
        }
        this.reservedQuantity += quantity;
        this.availableQuantity -= quantity;
        this.version += 1;
    }

    public void release(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }
        if (quantity > this.reservedQuantity) {
            throw new IllegalArgumentException("Quantity must be less than or equal to reserved quantity");
        }
        this.reservedQuantity -= quantity;
        this.availableQuantity += quantity;
        this.version += 1;
    }

    public void consume(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }
        if (quantity > this.reservedQuantity) {
            throw new IllegalArgumentException("Quantity must be less than or equal to reserved quantity");
        }
        this.reservedQuantity -= quantity;
        this.version += 1;
    }

    public void setQuantities(int availableQuantity, int reservedQuantity) {
        if (availableQuantity < 0 || reservedQuantity < 0) {
            throw new IllegalArgumentException("Quantities must be greater than or equal to 0");
        }
        this.availableQuantity = availableQuantity;
        this.reservedQuantity = reservedQuantity;
        this.version += 1;
    }

    public String getProductId() {
        return this.productId;
    }

    public int getAvailableQuantity() {
        return this.availableQuantity;
    }

    public int getReservedQuantity() {
        return this.reservedQuantity;
    }

    public int getVersion() {
        return this.version;
    }
}