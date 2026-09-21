package com.project.order.infrastructure.persistence.adapter;

import com.project.order.application.exception.NotFoundException;
import com.project.order.application.port.StockRepository;
import com.project.order.domain.model.Stock;
import com.project.order.infrastructure.persistence.entity.StockJpaEntity;
import com.project.order.infrastructure.persistence.repository.StockJpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class StockRepositoryAdapter implements StockRepository {

    private final StockJpaRepository jpaRepository;

    public StockRepositoryAdapter(StockJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Stock create(Stock stock) {
        StockJpaEntity saved = jpaRepository.save(new StockJpaEntity(
                stock.getProductId(), stock.getAvailableQuantity(), stock.getReservedQuantity()
        ));
        return toDomain(saved);
    }

    @Override
    public Optional<Stock> findById(String productId) {
        return jpaRepository.findById(productId).map(this::toDomain);
    }

    @Override
    public List<Stock> findAll() {
        return jpaRepository.findAll().stream().map(this::toDomain).toList();
    }

    /**
     * Propositalmente NÃO cria uma entidade nova com o version que veio do
     * domínio: recarrega a entidade gerenciada pelo Hibernate (mesma sessão,
     * já que o caso de uso é @Transactional) e só copia as quantidades.
     * É esse "entity.setX(...)" em cima do objeto gerenciado que faz o
     * Hibernate comparar a versão certa no UPDATE e lançar
     * OptimisticLockingFailureException em caso de conflito.
     */
    @Override
    public Stock update(Stock stock) {
        StockJpaEntity entity = jpaRepository.findById(stock.getProductId())
                .orElseThrow(() -> new NotFoundException("Stock not found: " + stock.getProductId()));
        entity.setAvailableQuantity(stock.getAvailableQuantity());
        entity.setReservedQuantity(stock.getReservedQuantity());
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public void delete(String productId) {
        jpaRepository.deleteById(productId);
    }

    private Stock toDomain(StockJpaEntity entity) {
        return new Stock(entity.getProductId(), entity.getAvailableQuantity(), entity.getReservedQuantity(), entity.getVersion());
    }
}
