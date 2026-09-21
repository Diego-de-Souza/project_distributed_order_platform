package com.project.order.application.usecase.client;

import com.project.order.application.port.ClientRepository;
import com.project.order.domain.model.Client;
import org.springframework.stereotype.Service;

@Service
public class CreateClientUseCase {

    private final ClientRepository clientRepository;

    public CreateClientUseCase(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    public Client execute(String name, String email) {
        Client client = Client.create(name, email);
        return clientRepository.create(client);
    }
}
