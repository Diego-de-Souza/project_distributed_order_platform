package com.project.order.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductTest {

    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("deve criar um produto ativo com os dados informados")
        void shouldCreateActiveProductWithGivenData() {
            String sku = "SKU-001";
            String name = "Teclado mecânico";
            double price = 350.0;

            Product product = Product.create(sku, name, price);

            assertNotNull(product.getId());
            assertEquals(sku, product.getSku());
            assertEquals(name, product.getName());
            assertEquals(price, product.getPrice().getValue());
            assertEquals(ProductStatus.ACTIVE, product.getStatus());
        }
    }

    @Nested
    @DisplayName("constructor")
    class Constructor {

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o sku for nulo")
        void shouldThrowWhenSkuIsNull() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Product("id-1", null, "Teclado", new Money(100.0), ProductStatus.ACTIVE)
            );

            assertEquals("SKU is required", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o sku for em branco")
        void shouldThrowWhenSkuIsBlank() {
            assertThrows(
                IllegalArgumentException.class,
                () -> new Product("id-1", "   ", "Teclado", new Money(100.0), ProductStatus.ACTIVE)
            );
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o nome for nulo")
        void shouldThrowWhenNameIsNull() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Product("id-1", "SKU-001", null, new Money(100.0), ProductStatus.ACTIVE)
            );

            assertEquals("Name is required", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o nome for em branco")
        void shouldThrowWhenNameIsBlank() {
            assertThrows(
                IllegalArgumentException.class,
                () -> new Product("id-1", "SKU-001", "   ", new Money(100.0), ProductStatus.ACTIVE)
            );
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o preço for zero (regra do Product, não do Money)")
        void shouldThrowWhenPriceIsZero() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Product("id-1", "SKU-001", "Teclado", new Money(0), ProductStatus.ACTIVE)
            );

            assertEquals("Price must be greater than 0", exception.getMessage());
        }

        @Test
        @DisplayName("deve usar ACTIVE como status padrão quando status for nulo")
        void shouldDefaultStatusToActiveWhenNull() {
            Product product = new Product("id-1", "SKU-001", "Teclado", new Money(100.0), null);

            assertEquals(ProductStatus.ACTIVE, product.getStatus());
        }
    }

    @Nested
    @DisplayName("canBeOrdered()")
    class CanBeOrdered {

        @Test
        @DisplayName("deve retornar true quando o produto estiver ACTIVE")
        void shouldReturnTrueWhenActive() {
            Product product = new Product("id-1", "SKU-001", "Teclado", new Money(100.0), ProductStatus.ACTIVE);

            assertTrue(product.canBeOrdered());
        }

        @Test
        @DisplayName("deve retornar false quando o produto estiver INACTIVE")
        void shouldReturnFalseWhenInactive() {
            Product product = new Product("id-1", "SKU-001", "Teclado", new Money(100.0), ProductStatus.INACTIVE);

            assertFalse(product.canBeOrdered());
        }
    }
}
