package com.project.order.infrastructure.idempotency;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.order.application.port.IdempotencyRepository;
import com.project.order.shared.enums.IdempotencyStatus;
import com.project.order.shared.interfaces.IdempotencyRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

/**
 * Implementa o padrão Idempotency-Key: tryStart faz um SET NX EX atômico
 * (setIfAbsent com TTL, no Redis isso é "SET key val NX EX ttl" numa
 * chamada só) — entre duas requisições simultâneas com a mesma chave, só
 * uma consegue "reservar" o direito de processar; a outra recebe false e
 * sabe que deve devolver a resposta já registrada (ou aguardar).
 */
@Component
public class RedisIdempotencyAdapter implements IdempotencyRepository {

    private static final String KEY_PREFIX = "idempotency:key:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public RedisIdempotencyAdapter(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean tryStart(String key, int ttlSeconds) {
        try {
            String payload = objectMapper.writeValueAsString(new IdempotencyRecord(IdempotencyStatus.IN_PROGRESS, 0, null));
            Boolean started = redisTemplate.opsForValue().setIfAbsent(redisKey(key), payload, Duration.ofSeconds(ttlSeconds));
            return Boolean.TRUE.equals(started);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to start idempotent operation", e);
        }
    }

    @Override
    public Optional<IdempotencyRecord> get(String key) {
        String raw = redisTemplate.opsForValue().get(redisKey(key));
        if (raw == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(objectMapper.readValue(raw, IdempotencyRecord.class));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @Override
    public void complete(String key, int statusCode, Object body, int ttlSeconds) {
        try {
            String payload = objectMapper.writeValueAsString(new IdempotencyRecord(IdempotencyStatus.COMPLETED, statusCode, body));
            redisTemplate.opsForValue().set(redisKey(key), payload, Duration.ofSeconds(ttlSeconds));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to complete idempotent operation", e);
        }
    }

    @Override
    public void release(String key) {
        redisTemplate.delete(redisKey(key));
    }

    private String redisKey(String key) {
        return KEY_PREFIX + key;
    }
}
