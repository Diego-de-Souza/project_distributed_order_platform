package com.project.order.domain.model;

import java.util.List;
import java.util.UUID;
import java.util.ArrayList;

public class Order {
    private final String id;
    private final String clientId;
    private List<OrderItem> items;
    private OrderStatus status;
    private Money total;
    private String paymentErrorCode;
    private String paymentErrorMessage;
    private int version;

    public Order(String id, String clientId, List<OrderItem> items, OrderStatus status, Money total, String paymentErrorCode, String paymentErrorMessage, int version) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("ID is required");
        }
        if (clientId == null || clientId.isBlank()) {
            throw new IllegalArgumentException("Client ID is required");
        }
        if (items == null) {
            throw new IllegalArgumentException("Items list is required");
        }
        if (version < 0) {
            throw new IllegalArgumentException("Version must be greater than or equal to 0");
        }
        this.id = id;
        this.clientId = clientId;
        this.items = items;
        this.status = status;
        this.total = total != null ? total : Money.zero();
        this.paymentErrorCode = paymentErrorCode;
        this.paymentErrorMessage = paymentErrorMessage;
        this.version = version;
    }

    public static Order create(String clientId) {
        return new Order(UUID.randomUUID().toString(), clientId, new ArrayList<>(), OrderStatus.PENDING, Money.zero(), null, null, 0);
    }

    public void addItem(OrderItem item) {
        if (item == null) {
            throw new IllegalArgumentException("Item is required");
        }
        this.items.add(item);
        this.total = calculateTotal();
        this.version += 1;
    }

    public void removeItem(String productId) {
        this.items.removeIf(item -> item.getProductId().equals(productId));
        this.total = calculateTotal();
        this.version += 1;
    }

    public void confirmOrder() {
        if (this.status != OrderStatus.PENDING) {
            throw new IllegalArgumentException("Order must be in pending status to be confirmed");
        }
        this.status = OrderStatus.CONFIRMED;
        this.paymentErrorCode = null;
        this.paymentErrorMessage = null;
        this.version += 1;
    }

    public void cancelOrder() {
        if (this.status != OrderStatus.PENDING) {
            throw new IllegalArgumentException("Order must be in pending status to be cancelled");
        }
        this.status = OrderStatus.CANCELLED;
        this.version += 1;
    }

    public void registerPaymentFailure(String code, String message) {
        if (this.status != OrderStatus.PENDING) {
            throw new IllegalArgumentException("Order must be in pending status to register payment failure");
        }
        this.paymentErrorCode = code;
        this.paymentErrorMessage = message;
        this.status = OrderStatus.CANCELLED;
        this.version += 1;
    }

    private Money calculateTotal() {
        Money sum = Money.zero();
        for (OrderItem item : this.items) {
            sum = sum.add(item.getSubTotal());
        }
        return sum;
    }

    public String getId() {
        return this.id;
    }

    public String getClientId() {
        return this.clientId;
    }

    public List<OrderItem> getItems() {
        return this.items;
    }

    public OrderStatus getStatus() {
        return this.status;
    }

    public Money getTotal() {
        return this.total;
    }

    public String getPaymentErrorCode() {
        return this.paymentErrorCode;
    }

    public String getPaymentErrorMessage() {
        return this.paymentErrorMessage;
    }

    public int getVersion() {
        return this.version;
    }
}
