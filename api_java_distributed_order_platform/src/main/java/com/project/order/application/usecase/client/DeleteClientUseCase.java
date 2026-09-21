package com.project.order.application.usecase.client;

import com.project.order.application.exception.NotFoundException;
import com.project.order.application.port.ClientRepository;
import org.springframework.stereotype.Service;

@Service
public class DeleteClientUseCase {

    private final ClientRepository clientRepository;

    public DeleteClientUseCase(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    public void execute(String id) {
        clientRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Client not found"));
        clientRepository.delete(id);
    }
}
