import { MiddlewareConsumer, Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { sequelizeConfig } from './config/sequelize.config';
import { ClientModule } from './modules/client.module';
import { OrderModule } from './modules/order.module';
import { PaymentModule } from './modules/payment.module';
import { ProductModule } from './modules/product.module';
import { RedisModule } from './modules/redis.module';
import { HealthController } from './presentation/http/health.controller';
import { HealthService } from './application/service/health.service';
import { RabbitMQModule } from './modules/rabbit-mq.module';
import { CorrelationIdMiddleware } from './presentation/http/middleware/correlation-id.middleware';
import { StockModule } from './modules/stock.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SequelizeModule.forRootAsync(sequelizeConfig),
    RedisModule,
    ClientModule,
    ProductModule,
    OrderModule,
    PaymentModule,
    RabbitMQModule,
    StockModule,
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
  ],
})
export class AppModule implements OnApplicationBootstrap{
  constructor(private readonly healthService: HealthService) {}

  async onApplicationBootstrap() {
    console.log('Running startup health checks...');

    const dbStatus = await this.healthService.checkDatabase();
    if (dbStatus.status === 'connected') {
      console.log('PostgreSQL:', dbStatus.message);
    } else {
      console.error('PostgreSQL:', dbStatus.message, dbStatus.error || '');
    }

    const redisStatus = await this.healthService.checkRedis();
    if (redisStatus.status === 'connected') {
      console.log('Redis:', redisStatus.message || 'connected');
    } else {
      console.error('Redis:', redisStatus.message, redisStatus.error || '');
    }

    console.log('Server ready');
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
