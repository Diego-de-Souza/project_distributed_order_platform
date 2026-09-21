package com.project.order.domain.model;

public class OrderItem {
    private final String productId;
    private final int quantity;
    private final Money unitPrice;

    public OrderItem(String productId, int quantity, Money unitPrice) {
        if (productId == null || productId.isBlank()) {
            throw new IllegalArgumentException("Product ID is required");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }
        if (unitPrice == null || unitPrice.getValue() <= 0) {
            throw new IllegalArgumentException("Unit price must be greater than 0");
        }
        this.productId = productId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public static OrderItem create(String productId, int quantity, double unitPrice) {
        return new OrderItem(productId, quantity, new Money(unitPrice));
    }

    public String getProductId() {
        return this.productId;
    }

    public int getQuantity() {
        return this.quantity;
    }

    public Money getUnitPrice() {
        return this.unitPrice;
    }

    public Money getSubTotal() {
        return this.unitPrice.multiply(this.quantity);
    }
}
