package com.project.order.presentation.http.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.order.application.port.IdempotencyRepository;
import com.project.order.shared.enums.IdempotencyStatus;
import com.project.order.shared.interfaces.IdempotencyRecord;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;

/**
 * Protege POST /orders e POST /payments contra reenvio duplicado (o
 * clássico "cliente clicou duas vezes" ou "timeout + retry automático").
 * Uso é opt-in via header Idempotency-Key — sem o header, o request segue
 * normal. Espelha o IdempotencyBodyInterceptor do NestJS, só que aqui feito
 * com um Filter (a barreira HTTP mais cedo possível) em vez de interceptor
 * do framework MVC.
 *
 * ponytail: request "IN_PROGRESS" concorrente devolve 409 direto em vez de
 * esperar o primeiro terminar (long-polling); simples e honesto o
 * suficiente pro objetivo didático aqui.
 */
@Component
public class IdempotencyKeyFilter extends OncePerRequestFilter {

    private static final String HEADER_NAME = "Idempotency-Key";
    private static final int TTL_SECONDS = 24 * 60 * 60;

    private final IdempotencyRepository idempotencyRepository;
    private final ObjectMapper objectMapper;

    public IdempotencyKeyFilter(IdempotencyRepository idempotencyRepository, ObjectMapper objectMapper) {
        this.idempotencyRepository = idempotencyRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        boolean isTargetPath = "/orders".equals(request.getRequestURI()) || "/payments".equals(request.getRequestURI());
        return !("POST".equalsIgnoreCase(request.getMethod()) && isTargetPath);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String key = request.getHeader(HEADER_NAME);
        if (key == null || key.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean started = idempotencyRepository.tryStart(key, TTL_SECONDS);
        if (!started) {
            var existing = idempotencyRepository.get(key);
            if (existing.isPresent() && existing.get().status() == IdempotencyStatus.COMPLETED) {
                replay(response, existing.get());
                return;
            }
            response.setStatus(HttpServletResponse.SC_CONFLICT);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"A request with this Idempotency-Key is already in progress\"}");
            return;
        }

        ContentCachingResponseWrapper wrapped = new ContentCachingResponseWrapper(response);
        try {
            filterChain.doFilter(request, wrapped);
            Object body = objectMapper.readValue(wrapped.getContentAsByteArray().length > 0
                    ? wrapped.getContentAsByteArray() : "null".getBytes(), Object.class);
            idempotencyRepository.complete(key, wrapped.getStatus(), body, TTL_SECONDS);
        } finally {
            wrapped.copyBodyToResponse();
        }
    }

    private void replay(HttpServletResponse response, IdempotencyRecord record) throws IOException {
        response.setStatus(record.statusCode());
        response.setContentType("application/json");
        objectMapper.writeValue(response.getWriter(), record.body());
    }
}
