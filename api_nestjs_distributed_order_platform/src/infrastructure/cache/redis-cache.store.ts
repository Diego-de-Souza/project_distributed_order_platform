import { Inject, Injectable } from "@nestjs/common";
import { Redis } from "ioredis";
import { CacheStoreInterface } from "src/application/port/redis-store.repository";
import { REDIS_CLIENT } from "src/shared/tokens_nest/redis.token";

@Injectable()
export class RedisCacheStore implements CacheStoreInterface {
    constructor(
        @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    ) {}

    async get<T>(key: string): Promise<T | null> {
        const raw = await this.redisClient.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
    }

    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
        await this.redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    }

    async del(key: string): Promise<void> {
        await this.redisClient.del(key);
    }
}