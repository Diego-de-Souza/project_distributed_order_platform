package com.project.order.application.exception;

/**
 * Recurso de domínio não encontrado (Client, Product, Stock, Order, Payment).
 * Fica na camada de aplicação, sem depender do Spring: quem decide que isso
 * vira HTTP 404 é a camada de apresentação (GlobalExceptionHandler), não o
 * caso de uso. Isso evita o vazamento de framework que a gente identificou
 * no NestJS de referência (lá o use case importa NotFoundException do
 * @nestjs/common direto).
 */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
