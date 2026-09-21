import { Inject, Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/shared/tokens_nest/redis.token';

@Injectable()
export class HealthService {
  constructor(
    private readonly sequelize: Sequelize,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  async checkDatabase(): Promise<{ status: string; message: string; error?: string }> {
    try {
      await this.sequelize.authenticate();
      return { status: 'connected', message: 'Database connection established' };
    } catch (error) {
      return {
        status: 'failed',
        message: 'Unable to connect to the database',
        error: process.env.NODE_ENV === 'production' ? undefined : (error as Error).message,
      };
    }
  }

  async checkRedis(): Promise<{ status: string; message?: string; pong?: string; error?: string }> {
    try {
      const pong = await this.redisClient.ping();
      return { status: pong === 'PONG' ? 'connected' : 'failed', pong };
    } catch (error) {
      return {
        status: 'failed',
        message: 'Unable to connect to Redis',
        error: process.env.NODE_ENV === 'production' ? undefined : (error as Error).message,
      };
    }
  }
}
