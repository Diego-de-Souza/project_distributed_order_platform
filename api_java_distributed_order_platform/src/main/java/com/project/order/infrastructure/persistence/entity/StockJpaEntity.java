package com.project.order.infrastructure.persistence.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/**
 * O @Version é o que faz o Optimistic Locking acontecer de verdade: o
 * Hibernate inclui "AND version = ?" no UPDATE e incrementa o valor
 * automaticamente. Se duas requisições lerem a mesma linha e tentarem
 * salvar, a segunda recebe 0 linhas afetadas -> Spring traduz isso em
 * OptimisticLockingFailureException.
 */
@Entity
@Table(name = "stocks")
public class StockJpaEntity {

    @Id
    private String productId;

    private int availableQuantity;

    private int reservedQuantity;

    @Version
    private int version;

    protected StockJpaEntity() {
        // JPA
    }

    public StockJpaEntity(String productId, int availableQuantity, int reservedQuantity) {
        this.productId = productId;
        this.availableQuantity = availableQuantity;
        this.reservedQuantity = reservedQuantity;
    }

    public String getProductId() { return productId; }
    public int getAvailableQuantity() { return availableQuantity; }
    public void setAvailableQuantity(int availableQuantity) { this.availableQuantity = availableQuantity; }
    public int getReservedQuantity() { return reservedQuantity; }
    public void setReservedQuantity(int reservedQuantity) { this.reservedQuantity = reservedQuantity; }
    public int getVersion() { return version; }
}
