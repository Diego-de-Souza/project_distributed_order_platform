package com.project.order.application.usecase.stock;

import com.project.order.application.exception.ConflictException;
import com.project.order.application.exception.NotFoundException;
import com.project.order.application.port.StockRepository;
import com.project.order.domain.model.Stock;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ajuste administrativo direto de quantidades (PUT /stock/{productId}).
 * A concorrência é resolvida pelo @Version do Stock na camada de
 * infraestrutura: se outra requisição alterou o registro entre o findById
 * e o update, o adapter JPA lança OptimisticLockingFailureException e aqui
 * a gente traduz isso pra um 409 de domínio.
 */
@Service
public class UpdateStockUseCase {

    private final StockRepository stockRepository;

    public UpdateStockUseCase(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    @Transactional
    public Stock execute(String productId, int availableQuantity, Integer reservedQuantity) {
        Stock stock = stockRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Stock not found"));

        int nextReserved = reservedQuantity != null ? reservedQuantity : stock.getReservedQuantity();
        stock.setQuantities(availableQuantity, nextReserved);

        try {
            return stockRepository.update(stock);
        } catch (OptimisticLockingFailureException e) {
            throw new ConflictException("Stock was modified by another request");
        }
    }
}
