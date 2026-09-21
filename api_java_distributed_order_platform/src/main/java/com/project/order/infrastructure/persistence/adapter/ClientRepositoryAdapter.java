package com.project.order.infrastructure.persistence.adapter;

import com.project.order.application.port.ClientRepository;
import com.project.order.domain.model.Client;
import com.project.order.domain.model.Email;
import com.project.order.infrastructure.persistence.entity.ClientJpaEntity;
import com.project.order.infrastructure.persistence.repository.ClientJpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class ClientRepositoryAdapter implements ClientRepository {

    private final ClientJpaRepository jpaRepository;

    public ClientRepositoryAdapter(ClientJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Client create(Client client) {
        String id = client.getId() != null ? client.getId() : UUID.randomUUID().toString();
        ClientJpaEntity saved = jpaRepository.save(new ClientJpaEntity(
                id, client.getName(), client.getEmail().getValue(), client.getStatus(),
                client.getCreatedAt(), client.getUpdatedAt()
        ));
        return toDomain(saved);
    }

    @Override
    public Optional<Client> findById(String id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Client> findAll() {
        return jpaRepository.findAll().stream().map(this::toDomain).toList();
    }

    @Override
    public Client update(Client client) {
        ClientJpaEntity saved = jpaRepository.save(new ClientJpaEntity(
                client.getId(), client.getName(), client.getEmail().getValue(), client.getStatus(),
                client.getCreatedAt(), client.getUpdatedAt()
        ));
        return toDomain(saved);
    }

    @Override
    public void delete(String id) {
        jpaRepository.deleteById(id);
    }

    private Client toDomain(ClientJpaEntity entity) {
        return new Client(entity.getId(), entity.getName(), new Email(entity.getEmail()),
                entity.getStatus(), entity.getCreatedAt(), entity.getUpdatedAt());
    }
}
