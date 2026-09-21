package com.project.order.shared.interfaces;

import com.project.order.shared.enums.IdempotencyStatus;

public record IdempotencyRecord(
    IdempotencyStatus status,
    int statusCode,
    Object body
) {}
