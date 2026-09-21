package com.project.order.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EmailTest {

    @Nested
    @DisplayName("constructor")
    class Constructor {

        @Test
        @DisplayName("deve aceitar um email em formato válido")
        void shouldAcceptValidEmail() {
            Email email = new Email("diego@example.com");

            assertEquals("diego@example.com", email.getValue());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o valor for nulo")
        void shouldThrowWhenValueIsNull() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Email(null)
            );

            assertEquals("Email is required", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o valor for em branco")
        void shouldThrowWhenValueIsBlank() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Email("   ")
            );

            assertEquals("Email is required", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o formato for inválido")
        void shouldThrowWhenFormatIsInvalid() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Email("nao-e-um-email")
            );

            assertEquals("Email is invalid", exception.getMessage());
        }
    }

    @Nested
    @DisplayName("equals()")
    class Equals {

        @Test
        @DisplayName("dois Email com o mesmo valor devem ser iguais")
        void shouldBeEqualWhenSameValue() {
            assertEquals(new Email("diego@example.com"), new Email("diego@example.com"));
        }
    }
}
