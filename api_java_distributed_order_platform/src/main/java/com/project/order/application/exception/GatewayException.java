package com.project.order.application.exception;

/**
 * Erro de transporte ao falar com o gateway de pagamento (timeout, conexão
 * recusada etc). Diferente de uma recusa de negócio (cartão negado), esse
 * tipo de erro é o que justifica retry.
 */
public class GatewayException extends RuntimeException {
    public GatewayException(String message) {
        super(message);
    }
}
