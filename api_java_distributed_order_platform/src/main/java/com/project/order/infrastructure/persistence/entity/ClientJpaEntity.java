package com.project.order.infrastructure.persistence.entity;

import com.project.order.domain.model.ClientStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "clients")
public class ClientJpaEntity {

    @Id
    private String id;

    private String name;

    private String email;

    @Enumerated(EnumType.STRING)
    private ClientStatus status;

    private Instant createdAt;

    private Instant updatedAt;

    protected ClientJpaEntity() {
        // JPA
    }

    public ClientJpaEntity(String id, String name, String email, ClientStatus status, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public ClientStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
