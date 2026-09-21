package com.project.order.infrastructure.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.order.application.port.RedisStoreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

/**
 * Cache-aside genérico usado por GetClientUseCase e GetProductUseCase.
 * Se o Redis estiver fora do ar, a gente loga e trata como cache miss em
 * vez de derrubar a requisição — cache é uma otimização, não deve virar
 * ponto único de falha pra uma leitura que o Postgres resolve sozinho.
 */
@Component
public class RedisStoreAdapter implements RedisStoreRepository {

    private static final Logger log = LoggerFactory.getLogger(RedisStoreAdapter.class);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public RedisStoreAdapter(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public <T> Optional<T> get(String key, Class<T> type) {
        try {
            String raw = redisTemplate.opsForValue().get(key);
            if (raw == null) {
                return Optional.empty();
            }
            return Optional.ofNullable(objectMapper.readValue(raw, type));
        } catch (Exception e) {
            log.warn("Redis cache read failed for key {}, treating as miss", key, e);
            return Optional.empty();
        }
    }

    @Override
    public <T> void set(String key, T value, int ttlSeconds) {
        try {
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(value), Duration.ofSeconds(ttlSeconds));
        } catch (Exception e) {
            log.warn("Redis cache write failed for key {}", key, e);
        }
    }

    @Override
    public void delete(String key) {
        redisTemplate.delete(key);
    }
}
