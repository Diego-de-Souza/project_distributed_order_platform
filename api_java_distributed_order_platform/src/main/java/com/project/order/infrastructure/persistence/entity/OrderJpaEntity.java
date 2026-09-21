package com.project.order.infrastructure.persistence.entity;

import com.project.order.domain.model.OrderStatus;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class OrderJpaEntity {

    @Id
    private String id;

    private String clientId;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private double total;

    private String paymentErrorCode;

    private String paymentErrorMessage;

    @Version
    private int version;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_items", joinColumns = @JoinColumn(name = "order_id"))
    private List<OrderItemEmbeddable> items = new ArrayList<>();

    protected OrderJpaEntity() {
        // JPA
    }

    public OrderJpaEntity(String id, String clientId, OrderStatus status, double total,
                           String paymentErrorCode, String paymentErrorMessage, List<OrderItemEmbeddable> items) {
        this.id = id;
        this.clientId = clientId;
        this.status = status;
        this.total = total;
        this.paymentErrorCode = paymentErrorCode;
        this.paymentErrorMessage = paymentErrorMessage;
        this.items = items;
    }

    public String getId() { return id; }
    public String getClientId() { return clientId; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public double getTotal() { return total; }
    public void setTotal(double total) { this.total = total; }
    public String getPaymentErrorCode() { return paymentErrorCode; }
    public void setPaymentErrorCode(String paymentErrorCode) { this.paymentErrorCode = paymentErrorCode; }
    public String getPaymentErrorMessage() { return paymentErrorMessage; }
    public void setPaymentErrorMessage(String paymentErrorMessage) { this.paymentErrorMessage = paymentErrorMessage; }
    public int getVersion() { return version; }
    public List<OrderItemEmbeddable> getItems() { return items; }
    public void setItems(List<OrderItemEmbeddable> items) { this.items = items; }
}
