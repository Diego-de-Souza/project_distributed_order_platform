package com.project.order.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ClientTest {

    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("deve criar um client ativo com os dados informados")
        void shouldCreateActiveClientWithGivenData() {
            String name = "Diego de Souza";
            String email = "diego@example.com";

            Client client = Client.create(name, email);

            assertNotNull(client.getId());
            assertEquals(name, client.getName());
            assertEquals(email, client.getEmail().getValue());
            assertEquals(ClientStatus.ACTIVE, client.getStatus());
            assertNotNull(client.getCreatedAt());
            assertNotNull(client.getUpdatedAt());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o email for em branco")
        void shouldThrowWhenEmailIsBlank() {
            assertThrows(
                IllegalArgumentException.class,
                () -> Client.create("Diego de Souza", "   ")
            );
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o email tiver formato inválido")
        void shouldThrowWhenEmailFormatIsInvalid() {
            assertThrows(
                IllegalArgumentException.class,
                () -> Client.create("Diego de Souza", "nao-e-um-email")
            );
        }
    }

    @Nested
    @DisplayName("constructor")
    class Constructor {

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o nome for nulo")
        void shouldThrowWhenNameIsNull() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Client("id-1", null, new Email("diego@example.com"), ClientStatus.ACTIVE, Instant.now(), Instant.now())
            );

            assertEquals("Name is required", exception.getMessage());
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o nome for em branco")
        void shouldThrowWhenNameIsBlank() {
            assertThrows(
                IllegalArgumentException.class,
                () -> new Client("id-1", "   ", new Email("diego@example.com"), ClientStatus.ACTIVE, Instant.now(), Instant.now())
            );
        }

        @Test
        @DisplayName("deve lançar IllegalArgumentException quando o email for nulo")
        void shouldThrowWhenEmailIsNull() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Client("id-1", "Diego de Souza", null, ClientStatus.ACTIVE, Instant.now(), Instant.now())
            );

            assertEquals("Email is required", exception.getMessage());
        }

        @Test
        @DisplayName("deve usar ACTIVE como status padrão quando status for nulo")
        void shouldDefaultStatusToActiveWhenNull() {
            Client client = new Client("id-1", "Diego de Souza", new Email("diego@example.com"), null, Instant.now(), Instant.now());

            assertEquals(ClientStatus.ACTIVE, client.getStatus());
        }

        @Test
        @DisplayName("deve preencher createdAt e updatedAt quando forem nulos")
        void shouldDefaultTimestampsWhenNull() {
            Client client = new Client("id-1", "Diego de Souza", new Email("diego@example.com"), ClientStatus.ACTIVE, null, null);

            assertNotNull(client.getCreatedAt());
            assertNotNull(client.getUpdatedAt());
        }
    }

    @Nested
    @DisplayName("canCreateOrder()")
    class CanCreateOrder {

        @Test
        @DisplayName("deve retornar true quando o client estiver ACTIVE")
        void shouldReturnTrueWhenActive() {
            Client client = new Client("id-1", "Diego de Souza", new Email("diego@example.com"), ClientStatus.ACTIVE, Instant.now(), Instant.now());

            assertTrue(client.canCreateOrder());
        }

        @Test
        @DisplayName("deve retornar false quando o client estiver INACTIVE")
        void shouldReturnFalseWhenInactive() {
            Client client = new Client("id-1", "Diego de Souza", new Email("diego@example.com"), ClientStatus.INACTIVE, Instant.now(), Instant.now());

            assertFalse(client.canCreateOrder());
        }
    }
}
