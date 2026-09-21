import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/sequelize";
import { Sequelize } from "sequelize-typescript";
import type { ClientRepositoryInterface } from "src/application/port/client.repository";
import type { EventPublisherRepositoryInterface } from "src/application/port/event-publisher.repository";
import type { OrderRepositoryInterface } from "src/application/port/order.repository";
import type { ProductRepositoryInterface } from "src/application/port/product.repository";
import type { StockRepositoryInterface } from "src/application/port/stock.repository";
import { OrderItemEntity } from "src/domain/entities/order-item.entity";
import { OrderEntity } from "src/domain/entities/order.entity";
import { StockEntity } from "src/domain/entities/stock.entity";
import { CreateOrderInput } from "src/shared/interfaces/order.interface";
import { CLIENT_REPOSITORY } from "src/shared/tokens_nest/client.token";
import { ORDER_REPOSITORY } from "src/shared/tokens_nest/order.token";
import { PRODUCT_REPOSITORY } from "src/shared/tokens_nest/product.token";
import { EVENT_PUBLISHER } from "src/shared/tokens_nest/rabbitmq.token";
import { STOCK_REPOSITORY } from "src/shared/tokens_nest/stock.token";

@Injectable()
export class CreateOrderUseCase {
    private readonly logger = new Logger(CreateOrderUseCase.name);

    constructor(
        @Inject(ORDER_REPOSITORY)
        private readonly orderRepository: OrderRepositoryInterface,
        @Inject(CLIENT_REPOSITORY)
        private readonly clientRepository: ClientRepositoryInterface,
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: ProductRepositoryInterface,
        @Inject(STOCK_REPOSITORY)
        private readonly stockRepository: StockRepositoryInterface,
        @InjectConnection()
        private readonly sequelize: Sequelize,
        @Inject(EVENT_PUBLISHER)
        private readonly eventPublisher: EventPublisherRepositoryInterface,
    ) {}

    async execute(input: CreateOrderInput): Promise<OrderEntity> {
        if (!input.items?.length) {
            throw new BadRequestException('Order must have at least one item');
        }

        const client = await this.clientRepository.findById(input.clientId);
        if (!client) {
            throw new NotFoundException('Client not found');
        }
        if (!client.canCreateOrder()) {
            throw new BadRequestException('Inactive client cannot create orders');
        }

        const { createdOrder, reservedStocks } = await this.sequelize.transaction(
            async (transaction) => {
                const order = new OrderEntity(input.clientId);
                const reservedStocks: StockEntity[] = [];

                for (const itemInput of input.items) {
                    const product = await this.productRepository.findById(
                        itemInput.productId,
                    );
                    if (!product) {
                        throw new NotFoundException(
                            `Product not found: ${itemInput.productId}`,
                        );
                    }
                    if (!product.canBeOrdered()) {
                        throw new BadRequestException(
                            `Product inactive: ${itemInput.productId}`,
                        );
                    }

                    const stock = await this.stockRepository.reserve(
                        itemInput.productId,
                        itemInput.quantity,
                        transaction,
                    );
                    reservedStocks.push(stock);

                    order.addItem(
                        new OrderItemEntity(
                            itemInput.productId,
                            itemInput.quantity,
                            product.getPrice(),
                        ),
                    );
                }

                const createdOrder = await this.orderRepository.create(order, transaction);

                return { createdOrder, reservedStocks };
            },
        );

        try {
            await this.eventPublisher.publishCreatedOrder(createdOrder);
        } catch (error) {
            this.logger.error(
                `Failed to publish OrderCreated for order ${createdOrder.getId()}`,
                error instanceof Error ? error.stack : String(error),
            );
        }

        for (const stock of reservedStocks) {
            try {
                await this.eventPublisher.publishStockReserved(stock);
            } catch (error) {
                this.logger.error(
                    `Failed to publish StockReserved for product ${stock.getProductId()}`,
                    error instanceof Error ? error.stack : String(error),
                );
            }
        }

        return createdOrder;
    }
}