import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import redisConfig from '../config/redis.config';
import { RedisConfig } from '../shared/interfaces/redis.interface';
import { CACHE_STORE, IDEMPOTENCY_STORE, REDIS_CLIENT } from 'src/shared/tokens_nest/redis.token';
import { RedisCacheStore } from 'src/infrastructure/cache/redis-cache.store';
import { RedisIdempotencyStore } from 'src/infrastructure/idempotency/redis-idempotency.store';

@Global()
@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService): Redis => {
        const config = configService.get<RedisConfig>('redis')!;
        return new Redis({
          host: config.host,
          port: config.port,
          password: config.password || undefined,
          db: config.db,
          retryStrategy: (times) => Math.min(times * 50, 2000),
          connectTimeout: 10000,
        });
      },
      inject: [ConfigService],
    },
    {
      provide: CACHE_STORE,
      useClass: RedisCacheStore,
    },
    {
      provide: IDEMPOTENCY_STORE,
      useClass: RedisIdempotencyStore,
    },
  ],
  exports: [REDIS_CLIENT, CACHE_STORE, IDEMPOTENCY_STORE],
})
export class RedisModule {}