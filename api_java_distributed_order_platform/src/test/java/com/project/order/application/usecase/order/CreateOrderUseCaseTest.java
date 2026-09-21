package com.project.order.application.usecase.order;

import com.project.order.application.exception.BusinessRuleException;
import com.project.order.application.exception.NotFoundException;
import com.project.order.application.usecase.support.InMemoryFakes.FakeClientRepository;
import com.project.order.application.usecase.support.InMemoryFakes.FakeOrderRepository;
import com.project.order.application.usecase.support.InMemoryFakes.FakeProductRepository;
import com.project.order.application.usecase.support.InMemoryFakes.FakeStockRepository;
import com.project.order.application.usecase.support.InMemoryFakes.NoOpEventPublisher;
import com.project.order.domain.model.Client;
import com.project.order.domain.model.Order;
import com.project.order.domain.model.Product;
import com.project.order.domain.model.Stock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CreateOrderUseCaseTest {

    private FakeClientRepository clientRepository;
    private FakeProductRepository productRepository;
    private FakeStockRepository stockRepository;
    private FakeOrderRepository orderRepository;
    private CreateOrderUseCase useCase;

    private Client client;
    private Product product;

    @BeforeEach
    void setUp() {
        clientRepository = new FakeClientRepository();
        productRepository = new FakeProductRepository();
        stockRepository = new FakeStockRepository();
        orderRepository = new FakeOrderRepository();
        useCase = new CreateOrderUseCase(orderRepository, clientRepository, productRepository, stockRepository, new NoOpEventPublisher());

        client = Client.create("Ada Lovelace", "ada@example.com");
        clientRepository.create(client);

        product = Product.create("SKU-1", "Mouse", 49.9);
        productRepository.create(product);
        stockRepository.create(Stock.create(product.getId(), 10, 0));
    }

    @Nested
    @DisplayName("Cria pedido com sucesso")
    class HappyPath {
        @Test
        @DisplayName("reserva o estoque e persiste o pedido com o total correto")
        void createsOrderAndReservesStock() {
            // Arrange
            var items = List.of(new CreateOrderUseCase.OrderItemRequest(product.getId(), 3));

            // Act
            Order order = useCase.execute(client.getId(), items);

            // Assert
            assertEquals(1, order.getItems().size());
            assertEquals(149.7, order.getTotal().getValue(), 0.0001);
            assertEquals(7, stockRepository.data.get(product.getId()).getAvailableQuantity());
            assertEquals(3, stockRepository.data.get(product.getId()).getReservedQuantity());
        }
    }

    @Nested
    @DisplayName("Regras de negócio")
    class BusinessRules {
        @Test
        @DisplayName("rejeita pedido sem itens")
        void rejectsEmptyOrder() {
            assertThrows(BusinessRuleException.class, () -> useCase.execute(client.getId(), List.of()));
        }

        @Test
        @DisplayName("rejeita cliente inexistente")
        void rejectsUnknownClient() {
            var items = List.of(new CreateOrderUseCase.OrderItemRequest(product.getId(), 1));
            assertThrows(NotFoundException.class, () -> useCase.execute("does-not-exist", items));
        }

        @Test
        @DisplayName("rejeita quando o estoque disponível é menor que o pedido")
        void rejectsInsufficientStock() {
            var items = List.of(new CreateOrderUseCase.OrderItemRequest(product.getId(), 999));
            assertThrows(BusinessRuleException.class, () -> useCase.execute(client.getId(), items));
        }
    }
}
