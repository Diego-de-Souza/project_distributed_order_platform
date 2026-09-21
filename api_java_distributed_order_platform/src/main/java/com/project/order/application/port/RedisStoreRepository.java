package com.project.order.application.port;

import java.util.Optional;

public interface RedisStoreRepository {
    <T> Optional<T> get(String key, Class<T> type);
    <T> void set(String key, T value, int ttlSeconds);
    void delete(String key);
}
