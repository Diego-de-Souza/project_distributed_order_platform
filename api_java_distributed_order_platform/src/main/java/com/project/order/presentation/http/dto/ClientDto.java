package com.project.order.presentation.http.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class ClientDto {

    public record CreateClientRequest(
            @NotBlank(message = "Name is required") String name,
            @NotBlank(message = "Email is required") @Email(message = "Email is invalid") String email
    ) {}

    public record ClientResponse(
            String id,
            String name,
            String email,
            String status,
            Instant createdAt,
            Instant updatedAt
    ) {}
}
