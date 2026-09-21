package com.project.order.infrastructure.persistence.entity;

import com.project.order.domain.model.PaymentStatus;
import com.project.order.infrastructure.persistence.entity.converter.JsonObjectConverter;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "payments")
public class PaymentJpaEntity {

    @Id
    private String id;

    private String orderId;

    private double amount;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private int attempts;

    private String lastErrorCode;

    private String lastErrorMessage;

    @Lob
    @Convert(converter = JsonObjectConverter.class)
    private Object gatewayRawResponse;

    private String externalId;

    protected PaymentJpaEntity() {
        // JPA
    }

    public PaymentJpaEntity(String id, String orderId, double amount, PaymentStatus status, int attempts,
                             String lastErrorCode, String lastErrorMessage, Object gatewayRawResponse, String externalId) {
        this.id = id;
        this.orderId = orderId;
        this.amount = amount;
        this.status = status;
        this.attempts = attempts;
        this.lastErrorCode = lastErrorCode;
        this.lastErrorMessage = lastErrorMessage;
        this.gatewayRawResponse = gatewayRawResponse;
        this.externalId = externalId;
    }

    public String getId() { return id; }
    public String getOrderId() { return orderId; }
    public double getAmount() { return amount; }
    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }
    public int getAttempts() { return attempts; }
    public String getLastErrorCode() { return lastErrorCode; }
    public void setLastErrorCode(String lastErrorCode) { this.lastErrorCode = lastErrorCode; }
    public String getLastErrorMessage() { return lastErrorMessage; }
    public void setLastErrorMessage(String lastErrorMessage) { this.lastErrorMessage = lastErrorMessage; }
    public Object getGatewayRawResponse() { return gatewayRawResponse; }
    public void setGatewayRawResponse(Object gatewayRawResponse) { this.gatewayRawResponse = gatewayRawResponse; }
    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }
}
