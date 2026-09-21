"""Cache-aside (CacheStore) e deduplicação de retries (IdempotencyStore),
os dois sobre Redis. try_start usa SET NX EX -- a mesma operação atômica
que a API Java faz via StringRedisTemplate.setIfAbsent(key, val, ttl): só
quem chega primeiro grava, quem chega depois recebe False e sabe que deve
reaproveitar a resposta já registrada em vez de repetir o efeito colateral."""
from __future__ import annotations

import json
from typing import Any, Optional

from redis.asyncio import Redis


class RedisCacheStore:
    def __init__(self, redis: Redis) -> None:
        self.redis = redis

    async def get(self, key: str) -> Optional[dict]:
        raw = await self.redis.get(key)
        return json.loads(raw) if raw else None

    async def set(self, key: str, value: dict, ttl_seconds: int) -> None:
        await self.redis.set(key, json.dumps(value), ex=ttl_seconds)

    async def delete(self, key: str) -> None:
        await self.redis.delete(key)


class RedisIdempotencyStore:
    _IN_PROGRESS = "__IN_PROGRESS__"

    def __init__(self, redis: Redis) -> None:
        self.redis = redis

    async def try_start(self, key: str, ttl_seconds: int) -> bool:
        return bool(await self.redis.set(key, self._IN_PROGRESS, ex=ttl_seconds, nx=True))

    async def get(self, key: str) -> Optional[dict]:
        raw = await self.redis.get(key)
        if not raw or raw == self._IN_PROGRESS:
            return None
        return json.loads(raw)

    async def complete(self, key: str, status_code: int, body: Any, ttl_seconds: int) -> None:
        await self.redis.set(key, json.dumps({"statusCode": status_code, "body": body}), ex=ttl_seconds)

    async def release(self, key: str) -> None:
        await self.redis.delete(key)
