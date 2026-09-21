package com.project.order.presentation.http.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Equivalente ao CorrelationIdMiddleware do NestJS: se o cliente mandar
 * X-Correlation-Id, reaproveita; senão gera um novo. Guarda no MDC do SLF4J
 * (em vez de AsyncLocalStorage) pra aparecer em todo log da requisição, e
 * devolve no header de resposta.
 */
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String HEADER_NAME = "X-Correlation-Id";
    private static final String MDC_KEY = "correlationId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String incoming = request.getHeader(HEADER_NAME);
        String correlationId = (incoming != null && !incoming.isBlank()) ? incoming : UUID.randomUUID().toString();

        response.setHeader(HEADER_NAME, correlationId);
        MDC.put(MDC_KEY, correlationId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }
}
