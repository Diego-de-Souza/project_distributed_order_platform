package com.project.order.domain.model;

import java.time.Instant;
import java.util.UUID;

public class Client {

    private final String id;
    private final String name;
    private final Email email;
    private final ClientStatus status;
    private final Instant createdAt;
    private final Instant updatedAt;

    public Client(String id, String name, Email email, ClientStatus status, Instant createdAt, Instant updatedAt) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (email == null) {
            throw new IllegalArgumentException("Email is required");
        }
        this.id = id;
        this.name = name;
        this.email = email;
        this.status = status != null ? status : ClientStatus.ACTIVE;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
    }

    public static Client create(String name, String email) {
        Instant now = Instant.now();
        return new Client(UUID.randomUUID().toString(), name, new Email(email), ClientStatus.ACTIVE, now, now);
    }

    public boolean canCreateOrder() {
        return this.status == ClientStatus.ACTIVE;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public Email getEmail() { return email; }
    public ClientStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
