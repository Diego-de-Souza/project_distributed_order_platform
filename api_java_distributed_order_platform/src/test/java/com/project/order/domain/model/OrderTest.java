package com.project.order.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OrderTest {

    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("deve criar um pedido pendente, sem itens e com total zero")
        void shouldCreateOrderWithGivenData() {
            String clientId = "456";

            Order order = Order.create(clientId);

            assertNotNull(order.getId());
            assertEquals(clientId, order.getClientId());
            assertTrue(order.getItems().isEmpty());
            assertEquals(OrderStatus.PENDING, order.getStatus());
            assertEquals(Money.zero(), order.getTotal());
            assertNull(order.getPaymentErrorCode());
            assertNull(order.getPaymentErrorMessage());
            assertEquals(0, order.getVersion());
        }
    }

    @Nested
    @DisplayName("constructor")
    class Constructor {

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o id for nulo")
        void shouldThrowWhenIdIsNull() {
            List<OrderItem> items = new ArrayList<>();

            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Order(null, "456", items, OrderStatus.PENDING, Money.zero(), null, null, 0)
            );

            assertEquals("ID is required", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o id for em branco")
        void shouldThrowWhenIdIsBlank() {
            List<OrderItem> items = new ArrayList<>();

            assertThrows(
                IllegalArgumentException.class,
                () -> new Order("   ", "456", items, OrderStatus.PENDING, Money.zero(), null, null, 0)
            );
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o clientId for nulo")
        void shouldThrowWhenClientIdIsNull() {
            List<OrderItem> items = new ArrayList<>();

            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Order("123", null, items, OrderStatus.PENDING, Money.zero(), null, null, 0)
            );

            assertEquals("Client ID is required", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o clientId for em branco")
        void shouldThrowWhenClientIdIsBlank() {
            List<OrderItem> items = new ArrayList<>();

            assertThrows(
                IllegalArgumentException.class,
                () -> new Order("123", "   ", items, OrderStatus.PENDING, Money.zero(), null, null, 0)
            );
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando os itens forem nulos")
        void shouldThrowWhenItemsIsNull() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Order("123", "456", null, OrderStatus.PENDING, Money.zero(), null, null, 0)
            );

            assertEquals("Items list is required", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando a versão for negativa")
        void shouldThrowWhenVersionIsNegative() {
            List<OrderItem> items = new ArrayList<>();

            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Order("123", "456", items, OrderStatus.PENDING, Money.zero(), null, null, -1)
            );

            assertEquals("Version must be greater than or equal to 0", exception.getMessage());
        }

        @Test
        @DisplayName("deve reconstruir um pedido válido com uma lista de itens preenchida")
        void shouldRebuildValidOrderWithItems() {
            List<OrderItem> items = new ArrayList<>();
            items.add(new OrderItem("produto-1", 2, new Money(50.0)));

            Order order = new Order("123", "456", items, OrderStatus.PENDING, new Money(100.0), null, null, 0);

            assertEquals("123", order.getId());
            assertEquals("456", order.getClientId());
            assertEquals(1, order.getItems().size());
            assertEquals(OrderStatus.PENDING, order.getStatus());
            assertEquals(new Money(100.0), order.getTotal());
            assertEquals(0, order.getVersion());
        }
    }
}
