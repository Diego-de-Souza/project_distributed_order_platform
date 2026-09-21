package com.project.order.presentation.http;

import com.project.order.application.exception.BusinessRuleException;
import com.project.order.application.exception.ConflictException;
import com.project.order.application.exception.NotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Único ponto que traduz exceção -> status HTTP. É aqui, e só aqui, que a
 * borda REST conhece HttpStatus — os casos de uso continuam lançando
 * exceções de aplicação "puras" (sem import nenhum de framework web).
 * Mesmo formato de corpo de erro do filtro global do NestJS de referência.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Object> handleNotFound(NotFoundException e, HttpServletRequest request) {
        return body(HttpStatus.NOT_FOUND, e.getMessage(), request);
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<Object> handleBusinessRule(BusinessRuleException e, HttpServletRequest request) {
        return body(HttpStatus.BAD_REQUEST, e.getMessage(), request);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<Object> handleConflict(ConflictException e, HttpServletRequest request) {
        return body(HttpStatus.CONFLICT, e.getMessage(), request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleIllegalArgument(IllegalArgumentException e, HttpServletRequest request) {
        return body(HttpStatus.BAD_REQUEST, e.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidation(MethodArgumentNotValidException e, HttpServletRequest request) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return body(HttpStatus.BAD_REQUEST, message.isBlank() ? "Validation failed" : message, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleUnexpected(Exception e, HttpServletRequest request) {
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", request);
    }

    private ResponseEntity<Object> body(HttpStatus status, String message, HttpServletRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("statusCode", status.value());
        payload.put("timestamp", Instant.now().toString());
        payload.put("path", request.getRequestURI());
        payload.put("message", message);
        return ResponseEntity.status(status).body(payload);
    }
}
