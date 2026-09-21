package com.project.order.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class StockTest {

    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("deve criar um estoque com versão zero")
        void shouldCreateStockWithZeroVersion() {
            // Arrange & Act
            Stock stock = Stock.create("product-001", 10, 0);

            // Assert
            assertEquals("product-001", stock.getProductId());
            assertEquals(10, stock.getAvailableQuantity());
            assertEquals(0, stock.getReservedQuantity());
            assertEquals(0, stock.getVersion());
        }
    }

    @Nested
    @DisplayName("constructor")
    class Constructor {

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o productId for nulo")
        void shouldThrowWhenProductIdIsNull() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Stock(null, 10, 0, 0)
            );

            assertEquals("Product ID is required", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando availableQuantity for negativo")
        void shouldThrowWhenAvailableQuantityIsNegative() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Stock("product-001", -1, 0, 0)
            );

            assertEquals("Available quantity must be greater than or equal to 0", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando reservedQuantity for negativo")
        void shouldThrowWhenReservedQuantityIsNegative() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Stock("product-001", 10, -1, 0)
            );

            assertEquals("Reserved quantity must be greater than or equal to 0", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando a versão for negativa")
        void shouldThrowWhenVersionIsNegative() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Stock("product-001", 10, 0, -1)
            );

            assertEquals("Version must be greater than or equal to 0", exception.getMessage());
        }
    }

    @Nested
    @DisplayName("reserve()")
    class Reserve {

        @Test
        @DisplayName("deve mover quantidade de disponível para reservado e incrementar a versão")
        void shouldMoveQuantityFromAvailableToReserved() {
            Stock stock = Stock.create("product-001", 10, 0);

            stock.reserve(4);

            assertEquals(6, stock.getAvailableQuantity());
            assertEquals(4, stock.getReservedQuantity());
            assertEquals(1, stock.getVersion());
        }

        @Test
        @DisplayName("deve permitir reservar exatamente toda a quantidade disponível (limite)")
        void shouldAllowReservingExactlyAllAvailableQuantity() {
            Stock stock = Stock.create("product-001", 10, 0);

            stock.reserve(10);

            assertEquals(0, stock.getAvailableQuantity());
            assertEquals(10, stock.getReservedQuantity());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando a quantidade for zero ou negativa")
        void shouldThrowWhenQuantityIsZeroOrNegative() {
            Stock stock = Stock.create("product-001", 10, 0);

            assertThrows(IllegalArgumentException.class, () -> stock.reserve(0));
            assertThrows(IllegalArgumentException.class, () -> stock.reserve(-1));
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando a quantidade exceder o disponível")
        void shouldThrowWhenQuantityExceedsAvailable() {
            Stock stock = Stock.create("product-001", 10, 0);

            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> stock.reserve(11)
            );

            assertEquals("Quantity must be less than or equal to available quantity", exception.getMessage());
        }
    }

    @Nested
    @DisplayName("release()")
    class Release {

        @Test
        @DisplayName("deve mover quantidade de reservado de volta para disponível e incrementar a versão")
        void shouldMoveQuantityFromReservedBackToAvailable() {
            Stock stock = Stock.create("product-001", 10, 0);
            stock.reserve(4);

            stock.release(4);

            assertEquals(10, stock.getAvailableQuantity());
            assertEquals(0, stock.getReservedQuantity());
            assertEquals(2, stock.getVersion());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando a quantidade exceder o reservado")
        void shouldThrowWhenQuantityExceedsReserved() {
            Stock stock = Stock.create("product-001", 10, 0);
            stock.reserve(4);

            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> stock.release(5)
            );

            assertEquals("Quantity must be less than or equal to reserved quantity", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando a quantidade for zero ou negativa")
        void shouldThrowWhenQuantityIsZeroOrNegative() {
            Stock stock = Stock.create("product-001", 10, 0);
            stock.reserve(4);

            assertThrows(IllegalArgumentException.class, () -> stock.release(0));
            assertThrows(IllegalArgumentException.class, () -> stock.release(-1));
        }
    }

    @Nested
    @DisplayName("consume()")
    class Consume {

        @Test
        @DisplayName("deve reduzir apenas o reservado, sem alterar o disponível")
        void shouldReduceOnlyReservedQuantity() {
            Stock stock = Stock.create("product-001", 10, 0);
            stock.reserve(4);

            stock.consume(4);

            assertEquals(6, stock.getAvailableQuantity());
            assertEquals(0, stock.getReservedQuantity());
            assertEquals(2, stock.getVersion());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando a quantidade exceder o reservado")
        void shouldThrowWhenQuantityExceedsReserved() {
            Stock stock = Stock.create("product-001", 10, 0);
            stock.reserve(4);

            assertThrows(IllegalArgumentException.class, () -> stock.consume(5));
        }
    }

    @Nested
    @DisplayName("setQuantities()")
    class SetQuantities {

        @Test
        @DisplayName("deve sobrescrever as quantidades e incrementar a versão")
        void shouldOverwriteQuantitiesAndIncrementVersion() {
            Stock stock = Stock.create("product-001", 10, 0);

            stock.setQuantities(20, 5);

            assertEquals(20, stock.getAvailableQuantity());
            assertEquals(5, stock.getReservedQuantity());
            assertEquals(1, stock.getVersion());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando alguma quantidade for negativa")
        void shouldThrowWhenAnyQuantityIsNegative() {
            Stock stock = Stock.create("product-001", 10, 0);

            assertThrows(IllegalArgumentException.class, () -> stock.setQuantities(-1, 0));
            assertThrows(IllegalArgumentException.class, () -> stock.setQuantities(0, -1));
        }
    }
}
