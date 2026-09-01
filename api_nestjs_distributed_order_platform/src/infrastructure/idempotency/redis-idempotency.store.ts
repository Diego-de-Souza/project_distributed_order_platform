import { Inject, Injectable } from "@nestjs/common";
import { Redis } from "ioredis";
import { IdempotencyRecord, IdempotencyStoreInterface } from "src/application/port/idempotency.repository";
import { REDIS_CLIENT } from "src/shared/tokens_nest/redis.token";

@Injectable()
export class RedisIdempotencyStore implements IdempotencyStoreInterface {
    constructor(
        @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    ) {}

    private redisKey(key: string): string {
        return `idempotency:key:${key}`;
    }

    async tryStart(key: string, ttlSeconds: number): Promise<boolean> {
        const record: IdempotencyRecord = { status: 'IN_PROGRESS' };
        // SET ... NX = "grava só se a chave AINDA NÃO existir". No Redis isso é
        // uma operação ATÔMICA de ponta a ponta — é essa atomicidade que garante
        // que, entre duas requisições simultâneas, só uma consegue "OK".
        const result = await this.redisClient.set(
            this.redisKey(key),
            JSON.stringify(record),
            'EX',
            ttlSeconds,
            'NX',
        );
        return result === 'OK';
    }

    async get(key: string): Promise<IdempotencyRecord | null> {
        const raw = await this.redisClient.get(this.redisKey(key));
        return raw ? (JSON.parse(raw) as IdempotencyRecord) : null;
    }

    async complete(key: string, statusCode: number, body: unknown, ttlSeconds: number): Promise<void> {
        const record: IdempotencyRecord = { status: 'COMPLETED', statusCode, body };
        await this.redisClient.set(this.redisKey(key), JSON.stringify(record), 'EX', ttlSeconds);
    }

    async release(key: string): Promise<void> {
        await this.redisClient.del(this.redisKey(key));
    }
}