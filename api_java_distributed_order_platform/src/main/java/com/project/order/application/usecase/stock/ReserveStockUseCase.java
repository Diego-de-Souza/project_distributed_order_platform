package com.project.order.application.usecase.stock;

import com.project.order.application.exception.BusinessRuleException;
import com.project.order.application.exception.ConflictException;
import com.project.order.application.exception.NotFoundException;
import com.project.order.application.port.StockRepository;
import com.project.order.domain.model.Stock;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReserveStockUseCase {

    private final StockRepository stockRepository;

    public ReserveStockUseCase(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    // @Transactional aqui não é só estilo: garante que o findById e o update
    // caem na MESMA sessão do Hibernate, então o @Version comparado no UPDATE
    // é o mesmo que acabamos de ler — sem isso, duas chamadas de repositório
    // separadas cada uma abriria (e fecharia) sua própria transação, e o
    // optimistic lock perderia o sentido.
    @Transactional
    public Stock execute(String productId, int quantity) {
        Stock stock = stockRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Stock not found"));

        try {
            stock.reserve(quantity);
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException(e.getMessage());
        }

        try {
            return stockRepository.update(stock);
        } catch (OptimisticLockingFailureException e) {
            throw new ConflictException("Stock was modified by another request, retry");
        }
    }
}
