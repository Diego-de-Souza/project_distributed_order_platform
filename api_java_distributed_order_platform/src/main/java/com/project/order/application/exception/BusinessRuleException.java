package com.project.order.application.exception;

/**
 * Violação de regra de negócio (ex.: cliente inativo criando pedido,
 * estoque insuficiente, transição de estado inválida). Mapeada para HTTP 400
 * na borda REST.
 */
public class BusinessRuleException extends RuntimeException {
    public BusinessRuleException(String message) {
        super(message);
    }
}
