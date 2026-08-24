import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import redisConfig from '../config/redis.config';
import { RedisConfig } from '../shared/interfaces/redis.interface';
import { REDIS_CLIENT } from 'src/shared/tokens_nest/redis.token';

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
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}