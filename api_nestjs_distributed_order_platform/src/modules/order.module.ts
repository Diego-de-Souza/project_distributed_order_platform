import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { CancelOrderUseCase } from "src/application/use-case/order/cancel-order.use-case";
import { ConfirmOrderUseCase } from "src/application/use-case/order/confirm-order.use-case";
import { CreateOrderUseCase } from "src/application/use-case/order/create-order.use-case";
import { GetOrderUseCase } from "src/application/use-case/order/get-order.use-case";
import { ListOrdersUseCase } from "src/application/use-case/order/list-orders.use-case";
import { OrderItemModel } from "src/infrastructure/persistence/postgres/models/order-item.model";
import { OrderModel } from "src/infrastructure/persistence/postgres/models/order.model";
import { OrderRepository } from "src/infrastructure/persistence/postgres/order-repository";
import { ClientModule } from "src/modules/client.module";
import { ProductModule } from "src/modules/product.module";
import { OrderController } from "src/presentation/http/order.controller";
import { ORDER_REPOSITORY } from "src/shared/tokens_nest/order.token";
import { RedisModule } from "./redis.module";
import { IdempotencyBodyInterceptor } from "src/presentation/http/interceptor/idempotency-body.interceptor";
import { RabbitMQModule } from "./rabbit-mq.module";
import { StockModule } from "./stock.module";

@Module({
    imports: [
        SequelizeModule.forFeature([OrderModel, OrderItemModel]),
        ClientModule,
        ProductModule,
        RedisModule,
        RabbitMQModule,
        StockModule
    ],
    controllers: [OrderController],
    providers: [
        OrderRepository,
        {
            provide: ORDER_REPOSITORY,
            useClass: OrderRepository,
        },
        CreateOrderUseCase,
        GetOrderUseCase,
        ListOrdersUseCase,
        ConfirmOrderUseCase,
        CancelOrderUseCase,
        IdempotencyBodyInterceptor
    ],
})
export class OrderModule {}
