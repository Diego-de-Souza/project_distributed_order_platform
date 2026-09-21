// src/config/redis.config.ts
import { registerAs } from '@nestjs/config';
import { RedisConfig } from 'src/shared/interfaces/redis.interface';

export default registerAs('redis', (): RedisConfig => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || '',
  db: parseInt(process.env.REDIS_DB || '0', 10),
  ttlIdempotency: parseInt(process.env.REDIS_TTL_IDEMPOTENCY || '43200', 10),
}));
