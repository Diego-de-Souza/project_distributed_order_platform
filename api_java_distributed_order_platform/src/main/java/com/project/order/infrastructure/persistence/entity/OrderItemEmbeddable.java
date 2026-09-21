package com.project.order.infrastructure.persistence.entity;

import jakarta.persistence.Embeddable;

/**
 * OrderItem não tem identidade própria nem existe fora de um Order (é um
 * snapshot imutável de preço no momento da compra) — no domínio já
 * observamos que ele se comporta como um Value Object. Por isso aqui ele
 * não vira uma @Entity com sua própria tabela + FK, e sim um @Embeddable
 * dentro de uma @ElementCollection do Order.
 */
@Embeddable
public class OrderItemEmbeddable {

    private String productId;
    private int quantity;
    private double unitPrice;

    protected OrderItemEmbeddable() {
        // JPA
    }

    public OrderItemEmbeddable(String productId, int quantity, double unitPrice) {
        this.productId = productId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public String getProductId() { return productId; }
    public int getQuantity() { return quantity; }
    public double getUnitPrice() { return unitPrice; }
}
