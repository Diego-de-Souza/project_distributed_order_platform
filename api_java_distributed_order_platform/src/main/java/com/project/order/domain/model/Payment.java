package com.project.order.domain.model;

import java.util.UUID;

public class Payment {
    private final String id;
    private final String orderId;
    private final Money amount;
    private PaymentStatus status;
    private int attempts;
    private String lastErrorCode;
    private String lastErrorMessage;
    private Object gatewayRawResponse;
    private String externalId;

    public Payment(String id, String orderId, Money amount, PaymentStatus status, int attempts, String lastErrorCode, String lastErrorMessage, Object gatewayRawResponse, String externalId) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("ID is required");
        }
        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("Order ID is required");
        }
        if (amount == null || amount.getValue() <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }
        if (attempts < 0) {
            throw new IllegalArgumentException("Attempts must be greater than or equal to 0");
        }
        this.id = id;
        this.orderId = orderId;
        this.amount = amount;
        this.status = status != null ? status : PaymentStatus.PENDING;
        this.attempts = attempts;
        this.lastErrorCode = lastErrorCode;
        this.lastErrorMessage = lastErrorMessage;
        this.gatewayRawResponse = gatewayRawResponse;
        this.externalId = externalId;
    }

    public static Payment create(String orderId, double amount) {
        return new Payment(UUID.randomUUID().toString(), orderId, new Money(amount), PaymentStatus.PENDING, 0, null, null, null, null);
    }

    public void markAsPaid(String externalId, Object rawResponse) {
        if (externalId == null || externalId.isBlank()) {
            throw new IllegalArgumentException("External ID is required");
        }
        if (this.status != PaymentStatus.PENDING) {
            throw new IllegalArgumentException("Payment is not pending");
        }

        this.status = PaymentStatus.PAID;
        this.externalId = externalId;
        this.gatewayRawResponse = rawResponse;
        this.lastErrorCode = null;
        this.lastErrorMessage = null;
    }

    public void markAsFailed(String errorCode, String errorMessage, Object rawResponse) {
        if (this.status != PaymentStatus.PENDING) {
            throw new IllegalArgumentException("Payment must be in pending status to be failed");
        }
        if (errorCode == null || errorCode.isBlank()) {
            throw new IllegalArgumentException("Error code is required");
        }
        if (errorMessage == null || errorMessage.isBlank()) {
            throw new IllegalArgumentException("Error message is required");
        }
        this.status = PaymentStatus.FAILED;
        this.lastErrorCode = errorCode;
        this.lastErrorMessage = errorMessage;
        if (rawResponse != null) {
            this.gatewayRawResponse = rawResponse;
        }
    }

    public Payment withId(String id) {
        return new Payment(id, this.orderId, this.amount, this.status, this.attempts, this.lastErrorCode, this.lastErrorMessage, this.gatewayRawResponse, this.externalId);
    }

    public String getId() {
        return this.id;
    }

    public String getOrderId() {
        return this.orderId;
    }

    public Money getAmount() {
        return this.amount;
    }

    public PaymentStatus getStatus() {
        return this.status;
    }

    public int getAttempts() {
        return this.attempts;
    }

    public String getLastErrorCode() {
        return this.lastErrorCode;
    }

    public String getLastErrorMessage() {
        return this.lastErrorMessage;
    }

    public Object getGatewayRawResponse() {
        return this.gatewayRawResponse;
    }

    public String getExternalId() {
        return this.externalId;
    }
}
