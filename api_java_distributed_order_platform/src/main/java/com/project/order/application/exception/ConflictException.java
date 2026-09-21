package com.project.order.application.exception;

/**
 * Conflito de estado: SKU duplicado, ou concorrência (optimistic lock
 * perdido no Stock/Order). Mapeada para HTTP 409.
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
