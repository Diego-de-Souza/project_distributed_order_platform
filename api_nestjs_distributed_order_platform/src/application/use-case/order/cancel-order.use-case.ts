import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/sequelize";
import { Sequelize } from "sequelize-typescript";
import type { OrderRepositoryInterface } from "src/application/port/order.repository";
import type { StockRepositoryInterface } from "src/application/port/stock.repository";
import { OrderEntity } from "src/domain/entities/order.entity";
import { ORDER_REPOSITORY } from "src/shared/tokens_nest/order.token";
import { STOCK_REPOSITORY } from "src/shared/tokens_nest/stock.token";

@Injectable()
export class CancelOrderUseCase {
    constructor(
        @Inject(ORDER_REPOSITORY)
        private readonly orderRepository: OrderRepositoryInterface,
        @Inject(STOCK_REPOSITORY)
        private readonly stockRepository: StockRepositoryInterface,
        @InjectConnection()
        private readonly sequelize: Sequelize,
    ) {}

    async execute(orderId: string): Promise<OrderEntity> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        try {
            order.cancelOrder();
        } catch (error) {
            throw new BadRequestException(
                error instanceof Error ? error.message : 'Unable to cancel order',
            );
        }

        return this.sequelize.transaction(async (transaction) => {
            for (const item of order.getItems()) {
                await this.stockRepository.release(
                    item.getProductId(),
                    item.getQuantity(),
                    transaction,
                );
            }

            await this.orderRepository.update(order, transaction);
            return order;
        });
    }
}
