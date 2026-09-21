package com.project.order.application.port;

import com.project.order.shared.interfaces.IdempotencyRecord;

import java.util.Optional;

public interface IdempotencyRepository {
    boolean tryStart(String key, int ttlSeconds);
    Optional<IdempotencyRecord> get(String key);
    void complete(String key, int statusCode, Object body, int ttlSeconds);
    void release(String key);
}
