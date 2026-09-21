package com.project.order.presentation.http;

import com.project.order.application.usecase.client.CreateClientUseCase;
import com.project.order.application.usecase.client.DeleteClientUseCase;
import com.project.order.application.usecase.client.GetClientUseCase;
import com.project.order.application.usecase.client.ListClientsUseCase;
import com.project.order.presentation.http.dto.ClientDto.ClientResponse;
import com.project.order.presentation.http.dto.ClientDto.CreateClientRequest;
import com.project.order.presentation.http.mapper.ClientMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/clients")
public class ClientController {

    private final CreateClientUseCase createClientUseCase;
    private final GetClientUseCase getClientUseCase;
    private final ListClientsUseCase listClientsUseCase;
    private final DeleteClientUseCase deleteClientUseCase;

    public ClientController(
            CreateClientUseCase createClientUseCase,
            GetClientUseCase getClientUseCase,
            ListClientsUseCase listClientsUseCase,
            DeleteClientUseCase deleteClientUseCase
    ) {
        this.createClientUseCase = createClientUseCase;
        this.getClientUseCase = getClientUseCase;
        this.listClientsUseCase = listClientsUseCase;
        this.deleteClientUseCase = deleteClientUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClientResponse create(@Valid @RequestBody CreateClientRequest body) {
        return ClientMapper.toResponse(createClientUseCase.execute(body.name(), body.email()));
    }

    @GetMapping
    public List<ClientResponse> list() {
        return listClientsUseCase.execute().stream().map(ClientMapper::toResponse).toList();
    }

    @GetMapping("/{id}")
    public ClientResponse getById(@PathVariable String id) {
        return ClientMapper.toResponse(getClientUseCase.execute(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable String id) {
        deleteClientUseCase.execute(id);
        return ResponseEntity.ok(Map.of("message", "Client deleted successfully"));
    }
}
