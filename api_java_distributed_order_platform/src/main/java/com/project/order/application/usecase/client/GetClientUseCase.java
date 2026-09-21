package com.project.order.application.usecase.client;

import com.project.order.application.exception.NotFoundException;
import com.project.order.application.port.ClientRepository;
import com.project.order.application.port.RedisStoreRepository;
import com.project.order.domain.model.Client;
import com.project.order.domain.model.ClientStatus;
import com.project.order.domain.model.Email;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Cache-aside em cima do Redis, igual ao GetClientUseCase do NestJS.
 * Guarda um "retrato" simples (record) em vez da entidade de domínio
 * crua: Client não tem construtor vazio nem setters, então serializar e
 * desserializar o objeto de domínio direto via Jackson seria frágil. O
 * record é só o formato de transporte do cache.
 */
@Service
public class GetClientUseCase {

    private static final int CLIENT_CACHE_TTL_SECONDS = 300;

    private record CachedClient(String id, String name, String email, ClientStatus status, Instant createdAt, Instant updatedAt) {}

    private final ClientRepository clientRepository;
    private final RedisStoreRepository cacheStore;

    public GetClientUseCase(ClientRepository clientRepository, RedisStoreRepository cacheStore) {
        this.clientRepository = clientRepository;
        this.cacheStore = cacheStore;
    }

    public Client execute(String clientId) {
        String cacheKey = "client:" + clientId;

        var cached = cacheStore.get(cacheKey, CachedClient.class);
        if (cached.isPresent()) {
            CachedClient c = cached.get();
            return new Client(c.id(), c.name(), new Email(c.email()), c.status(), c.createdAt(), c.updatedAt());
        }

        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new NotFoundException("Client not found"));

        cacheStore.set(cacheKey, new CachedClient(
                client.getId(), client.getName(), client.getEmail().getValue(),
                client.getStatus(), client.getCreatedAt(), client.getUpdatedAt()
        ), CLIENT_CACHE_TTL_SECONDS);

        return client;
    }
}
