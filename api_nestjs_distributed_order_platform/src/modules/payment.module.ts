import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { CreatePaymentUseCase } from "src/application/use-case/payment/create-payment.use-case";
import { StubPaymentGateway } from "src/infrastructure/payment/stub-payment.gateway";
import { OrderItemModel } from "src/infrastructure/persistence/postgres/models/order-item.model";
import { OrderModel } from "src/infrastructure/persistence/postgres/models/order.model";
import { PaymentModel } from "src/infrastructure/persistence/postgres/models/payment.model";
import { StockModel } from "src/infrastructure/persistence/postgres/models/stock.model";
import { OrderRepository } from "src/infrastructure/persistence/postgres/order-repository";
import { PaymentRepository } from "src/infrastructure/persistence/postgres/payment-repository";
import { StockRepository } from "src/infrastructure/persistence/postgres/stock-repository";
import { SequelizeUnitOfWork } from "src/infrastructure/persistence/postgres/unit-of-work.repository";
import { IdempotencyBodyInterceptor } from "src/presentation/http/interceptor/idempotency-body.interceptor";
import { PaymentController } from "src/presentation/http/payment.controller";
import { GATEWAY_REPOSITORY } from "src/shared/tokens_nest/gateway.token";
import { ORDER_REPOSITORY } from "src/shared/tokens_nest/order.token";
import {
    PAYMENT_REPOSITORY,
    UNIT_OF_WORK_REPOSITORY,
} from "src/shared/tokens_nest/payment.token";
import { RedisModule } from "./redis.module";

@Module({
    imports: [
        RedisModule,
        SequelizeModule.forFeature([
            PaymentModel,
            OrderModel,
            OrderItemModel,
            StockModel,
        ]),
    ],
    controllers: [PaymentController],
    providers: [
        PaymentRepository,
        OrderRepository,
        StockRepository,
        SequelizeUnitOfWork,
        StubPaymentGateway,
        {
            provide: PAYMENT_REPOSITORY,
            useClass: PaymentRepository,
        },
        {
            provide: UNIT_OF_WORK_REPOSITORY,
            useClass: SequelizeUnitOfWork,
        },
        {
            provide: ORDER_REPOSITORY,
            useClass: OrderRepository,
        },
        {
            provide: GATEWAY_REPOSITORY,
            useClass: StubPaymentGateway,
        },
        CreatePaymentUseCase,
        IdempotencyBodyInterceptor,
    ],
})
export class PaymentModule {}
