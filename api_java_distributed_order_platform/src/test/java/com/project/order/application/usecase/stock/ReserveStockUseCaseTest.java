package com.project.order.application.usecase.stock;

import com.project.order.application.exception.BusinessRuleException;
import com.project.order.application.exception.NotFoundException;
import com.project.order.application.usecase.support.InMemoryFakes.FakeStockRepository;
import com.project.order.domain.model.Stock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ReserveStockUseCaseTest {

    private FakeStockRepository stockRepository;
    private ReserveStockUseCase useCase;

    @BeforeEach
    void setUp() {
        stockRepository = new FakeStockRepository();
        useCase = new ReserveStockUseCase(stockRepository);
        stockRepository.create(Stock.create("product-1", 5, 0));
    }

    @Test
    @DisplayName("reserva quando há disponibilidade suficiente")
    void reservesWhenAvailable() {
        Stock updated = useCase.execute("product-1", 5);

        assertEquals(0, updated.getAvailableQuantity());
        assertEquals(5, updated.getReservedQuantity());
    }

    @Test
    @DisplayName("rejeita reserva maior que o disponível")
    void rejectsWhenNotEnoughAvailable() {
        assertThrows(BusinessRuleException.class, () -> useCase.execute("product-1", 6));
    }

    @Test
    @DisplayName("rejeita produto sem estoque cadastrado")
    void rejectsUnknownProduct() {
        assertThrows(NotFoundException.class, () -> useCase.execute("does-not-exist", 1));
    }
}
