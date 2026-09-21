import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import rabbitmqConfig from 'src/config/rabbitmq.config';
import { RabbitMQEventPublisher } from 'src/infrastructure/messaging/rabbitmq-event.publish';
import { EVENT_PUBLISHER, RABBITMQ_CLIENT } from 'src/shared/tokens_nest/rabbitmq.token';

@Module({
  imports: [
    ConfigModule.forFeature(rabbitmqConfig),
    ClientsModule.registerAsync([
      {
        name: RABBITMQ_CLIENT,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('rabbitmq.url')],
            queue: configService.getOrThrow<string>('rabbitmq.queue'),
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule,{
    provide: EVENT_PUBLISHER,
    useClass: RabbitMQEventPublisher,
  }],
  providers: [
    {
      provide: EVENT_PUBLISHER,
      useClass: RabbitMQEventPublisher,
    }
  ],
})
export class RabbitMQModule {}
