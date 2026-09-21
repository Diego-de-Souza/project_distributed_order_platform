package com.project.order.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PaymentTest {

    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("deve criar um pagamento pendente com os dados informados")
        void shouldCreatePendingPaymentWithGivenData() {
            Payment payment = Payment.create("order-001", 150.0);

            assertNotNull(payment.getId());
            assertEquals("order-001", payment.getOrderId());
            assertEquals(150.0, payment.getAmount().getValue());
            assertEquals(PaymentStatus.PENDING, payment.getStatus());
            assertEquals(0, payment.getAttempts());
            assertNull(payment.getLastErrorCode());
            assertNull(payment.getLastErrorMessage());
            assertNull(payment.getExternalId());
        }
    }

    @Nested
    @DisplayName("constructor")
    class Constructor {

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o id for nulo")
        void shouldThrowWhenIdIsNull() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Payment(null, "order-001", new Money(100.0), PaymentStatus.PENDING, 0, null, null, null, null)
            );

            assertEquals("ID is required", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o orderId for nulo")
        void shouldThrowWhenOrderIdIsNull() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Payment("payment-001", null, new Money(100.0), PaymentStatus.PENDING, 0, null, null, null, null)
            );

            assertEquals("Order ID is required", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o valor for zero (regra do Payment, não do Money)")
        void shouldThrowWhenAmountIsZero() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Payment("payment-001", "order-001", new Money(0), PaymentStatus.PENDING, 0, null, null, null, null)
            );

            assertEquals("Amount must be greater than 0", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando as tentativas forem negativas")
        void shouldThrowWhenAttemptsIsNegative() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Payment("payment-001", "order-001", new Money(100.0), PaymentStatus.PENDING, -1, null, null, null, null)
            );

            assertEquals("Attempts must be greater than or equal to 0", exception.getMessage());
        }

        @Test
        @DisplayName("deve usar PENDING como status padrão quando status for nulo")
        void shouldDefaultStatusToPendingWhenNull() {
            Payment payment = new Payment("payment-001", "order-001", new Money(100.0), null, 0, null, null, null, null);

            assertEquals(PaymentStatus.PENDING, payment.getStatus());
        }
    }

    @Nested
    @DisplayName("markAsPaid()")
    class MarkAsPaid {

        @Test
        @DisplayName("deve marcar como PAID quando estiver PENDING")
        void shouldMarkAsPaidWhenPending() {
            Payment payment = Payment.create("order-001", 100.0);

            payment.markAsPaid("ext-123", "{\"ok\":true}");

            assertEquals(PaymentStatus.PAID, payment.getStatus());
            assertEquals("ext-123", payment.getExternalId());
            assertNull(payment.getLastErrorCode());
            assertNull(payment.getLastErrorMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o externalId for nulo ou em branco")
        void shouldThrowWhenExternalIdIsNullOrBlank() {
            Payment payment = Payment.create("order-001", 100.0);

            assertThrows(IllegalArgumentException.class, () -> payment.markAsPaid(null, null));
            assertThrows(IllegalArgumentException.class, () -> payment.markAsPaid("   ", null));
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o pagamento não estiver PENDING")
        void shouldThrowWhenPaymentIsNotPending() {
            Payment payment = Payment.create("order-001", 100.0);
            payment.markAsPaid("ext-123", null);

            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> payment.markAsPaid("ext-456", null)
            );

            assertEquals("Payment is not pending", exception.getMessage());
        }
    }

    @Nested
    @DisplayName("markAsFailed()")
    class MarkAsFailed {

        @Test
        @DisplayName("deve marcar como FAILED quando estiver PENDING")
        void shouldMarkAsFailedWhenPending() {
            Payment payment = Payment.create("order-001", 100.0);

            payment.markAsFailed("CARD_DECLINED", "Cartão recusado pela operadora", null);

            assertEquals(PaymentStatus.FAILED, payment.getStatus());
            assertEquals("CARD_DECLINED", payment.getLastErrorCode());
            assertEquals("Cartão recusado pela operadora", payment.getLastErrorMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o errorCode for nulo ou em branco")
        void shouldThrowWhenErrorCodeIsNullOrBlank() {
            Payment payment = Payment.create("order-001", 100.0);

            assertThrows(IllegalArgumentException.class, () -> payment.markAsFailed(null, "erro", null));
            assertThrows(IllegalArgumentException.class, () -> payment.markAsFailed("   ", "erro", null));
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o errorMessage for nulo ou em branco")
        void shouldThrowWhenErrorMessageIsNullOrBlank() {
            Payment payment = Payment.create("order-001", 100.0);

            assertThrows(IllegalArgumentException.class, () -> payment.markAsFailed("ERR", null, null));
            assertThrows(IllegalArgumentException.class, () -> payment.markAsFailed("ERR", "   ", null));
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o pagamento não estiver PENDING")
        void shouldThrowWhenPaymentIsNotPending() {
            Payment payment = Payment.create("order-001", 100.0);
            payment.markAsFailed("ERR", "erro", null);

            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> payment.markAsFailed("ERR2", "outro erro", null)
            );

            assertEquals("Payment must be in pending status to be failed", exception.getMessage());
        }
    }

    @Nested
    @DisplayName("withId()")
    class WithId {

        @Test
        @DisplayName("deve retornar um novo Payment com o id informado, mantendo os demais campos")
        void shouldReturnNewPaymentWithGivenIdKeepingOtherFields() {
            Payment payment = Payment.create("order-001", 100.0);

            Payment withNewId = payment.withId("payment-999");

            assertEquals("payment-999", withNewId.getId());
            assertEquals(payment.getOrderId(), withNewId.getOrderId());
            assertEquals(payment.getAmount(), withNewId.getAmount());
            assertEquals(payment.getStatus(), withNewId.getStatus());
        }
    }
}
