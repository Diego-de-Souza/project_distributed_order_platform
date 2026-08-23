import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/sequelize";
import { Sequelize } from "sequelize-typescript";
import type { ClientRepositoryInterface } from "src/application/port/client.repository";
import type { OrderRepositoryInterface } from "src/application/port/order.repository";
import type { ProductRepositoryInterface } from "src/application/port/product.repository";
import type { StockRepositoryInterface } from "src/application/port/stock.repository";
import { OrderItemEntity } from "src/domain/entities/order-item.entity";
import { OrderEntity } from "src/domain/entities/order.entity";
import { CreateOrderInput } from "src/shared/interfaces/order.interface";
import { CLIENT_REPOSITORY } from "src/shared/tokens_nest/client.token";
import { ORDER_REPOSITORY } from "src/shared/tokens_nest/order.token";
import { PRODUCT_REPOSITORY } from "src/shared/tokens_nest/product.token";
import { STOCK_REPOSITORY } from "src/shared/tokens_nest/stock.token";

@Injectable()
export class CreateOrderUseCase {
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

        return this.sequelize.transaction(async (transaction) => {
            const order = new OrderEntity(input.clientId);

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

                await this.stockRepository.reserve(
                    itemInput.productId,
                    itemInput.quantity,
                    transaction,
                );

                order.addItem(
                    new OrderItemEntity(
                        itemInput.productId,
                        itemInput.quantity,
                        product.getPrice(),
                    ),
                );
            }

            return this.orderRepository.create(order, transaction);
        });
    }
}
