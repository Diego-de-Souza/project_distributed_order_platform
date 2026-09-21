package com.project.order.application.port;

import com.project.order.domain.model.Client;

import java.util.List;
import java.util.Optional;

public interface ClientRepository {
    Client create(Client client);
    Optional<Client> findById(String id);
    List<Client> findAll();
    Client update(Client client);
    void delete(String id);
}
