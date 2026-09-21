package com.project.order.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OrderItemTest {

    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("deve criar um item com os dados informados")
        void shouldCreateItemWithGivenData() {
            String productId = "product-001";
            int quantity = 3;
            double unitPrice = 10.0;

            OrderItem item = OrderItem.create(productId, quantity, unitPrice);

            assertEquals(productId, item.getProductId());
            assertEquals(quantity, item.getQuantity());
            assertEquals(unitPrice, item.getUnitPrice().getValue());
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
                () -> new OrderItem(null, 1, new Money(10.0))
            );

            assertEquals("Product ID is required", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o productId for em branco")
        void shouldThrowWhenProductIdIsBlank() {
            assertThrows(
                IllegalArgumentException.class,
                () -> new OrderItem("   ", 1, new Money(10.0))
            );
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando a quantidade for zero")
        void shouldThrowWhenQuantityIsZero() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new OrderItem("product-001", 0, new Money(10.0))
            );

            assertEquals("Quantity must be greater than 0", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando a quantidade for negativa")
        void shouldThrowWhenQuantityIsNegative() {
            assertThrows(
                IllegalArgumentException.class,
                () -> new OrderItem("product-001", -1, new Money(10.0))
            );
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o preço unitário for zero (regra do OrderItem, não do Money)")
        void shouldThrowWhenUnitPriceIsZero() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new OrderItem("product-001", 1, new Money(0))
            );

            assertEquals("Unit price must be greater than 0", exception.getMessage());
        }
    }

    @Nested
    @DisplayName("getSubTotal()")
    class GetSubTotal {

        @Test
        @DisplayName("deve calcular o subtotal como quantidade vezes preço unitário")
        void shouldCalculateSubtotalAsQuantityTimesUnitPrice() {
            OrderItem item = OrderItem.create("product-001", 3, 15.5);

            assertEquals(46.5, item.getSubTotal().getValue(), 0.0001);
        }
    }
}
