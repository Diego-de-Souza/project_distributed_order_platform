package com.project.order.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MoneyTest {

    @Nested
    @DisplayName("constructor")
    class Constructor {

        @Test
        @DisplayName("deve aceitar valor zero")
        void shouldAcceptZero() {
            Money money = new Money(0);

            assertEquals(0.0, money.getValue());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o valor for negativo")
        void shouldThrowWhenValueIsNegative() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Money(-0.01)
            );

            assertEquals("Amount must be greater than or equal to 0", exception.getMessage());
        }
    }

    @Nested
    @DisplayName("add()")
    class Add {

        @Test
        @DisplayName("deve somar dois valores")
        void shouldSumTwoValues() {
            Money result = new Money(10.5).add(new Money(4.5));

            assertEquals(15.0, result.getValue());
        }
    }

    @Nested
    @DisplayName("multiply()")
    class Multiply {

        @Test
        @DisplayName("deve multiplicar o valor pela quantidade")
        void shouldMultiplyValueByQuantity() {
            Money result = new Money(10.0).multiply(3);

            assertEquals(30.0, result.getValue());
        }
    }

    @Nested
    @DisplayName("equals()")
    class Equals {

        @Test
        @DisplayName("dois Money com o mesmo valor devem ser iguais")
        void shouldBeEqualWhenSameValue() {
            assertEquals(new Money(10.0), new Money(10.0));
        }
    }
}
