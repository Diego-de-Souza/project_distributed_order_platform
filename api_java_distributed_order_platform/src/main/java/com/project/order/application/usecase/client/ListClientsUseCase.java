package com.project.order.application.usecase.client;

import com.project.order.application.port.ClientRepository;
import com.project.order.domain.model.Client;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ListClientsUseCase {

    private final ClientRepository clientRepository;

    public ListClientsUseCase(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    public List<Client> execute() {
        return clientRepository.findAll();
    }
}
