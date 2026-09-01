import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/sequelize";
import { Sequelize } from "sequelize-typescript";
import type { EventPublisherRepositoryInterface } from "src/application/port/event-publisher.repository";
import type { OrderRepositoryInterface } from "src/application/port/order.repository";
import type { StockRepositoryInterface } from "src/application/port/stock.repository";
import { OrderEntity } from "src/domain/entities/order.entity";
import { StockEntity } from "src/domain/entities/stock.entity";
import { ORDER_REPOSITORY } from "src/shared/tokens_nest/order.token";
import { EVENT_PUBLISHER } from "src/shared/tokens_nest/rabbitmq.token";
import { STOCK_REPOSITORY } from "src/shared/tokens_nest/stock.token";

@Injectable()
export class CancelOrderUseCase {
    private readonly logger = new Logger(CancelOrderUseCase.name);

    constructor(
        @Inject(ORDER_REPOSITORY)
        private readonly orderRepository: OrderRepositoryInterface,
        @Inject(STOCK_REPOSITORY)
        private readonly stockRepository: StockRepositoryInterface,
        @InjectConnection()
        private readonly sequelize: Sequelize,
        @Inject(EVENT_PUBLISHER)
        private readonly eventPublisher: EventPublisherRepositoryInterface,
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

        const releasedStocks = await this.sequelize.transaction(
            async (transaction): Promise<StockEntity[]> => {
                const stocks: StockEntity[] = [];

                for (const item of order.getItems()) {
                    const stock = await this.stockRepository.release(
                        item.getProductId(),
                        item.getQuantity(),
                        transaction,
                    );
                    stocks.push(stock);
                }

                await this.orderRepository.update(order, transaction);
                return stocks;
            },
        );

        try {
            await this.eventPublisher.publishCancelledOrder(order);
        } catch (error) {
            this.logger.error(
                `Failed to publish OrderCancelled for order ${order.getId()}`,
                error instanceof Error ? error.stack : String(error),
            );
        }

        for (const stock of releasedStocks) {
            try {
                await this.eventPublisher.publishStockReleased(stock);
            } catch (error) {
                this.logger.error(
                    `Failed to publish StockReleased for product ${stock.getProductId()}`,
                    error instanceof Error ? error.stack : String(error),
                );
            }
        }

        return order;
    }
}