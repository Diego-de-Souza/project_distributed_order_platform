package com.project.order.presentation.http.mapper;

import com.project.order.domain.model.Client;
import com.project.order.presentation.http.dto.ClientDto.ClientResponse;

public class ClientMapper {

    private ClientMapper() {}

    public static ClientResponse toResponse(Client client) {
        return new ClientResponse(
                client.getId(),
                client.getName(),
                client.getEmail().getValue(),
                client.getStatus().name(),
                client.getCreatedAt(),
                client.getUpdatedAt()
        );
    }
}
