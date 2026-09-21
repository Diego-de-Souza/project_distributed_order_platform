package com.project.order.shared.interfaces;

public record GatewayResult(
    boolean success,
    String externalId,
    String status,
    String errorCode,
    String errorMessage,
    String kind,
    Object raw
) {}
