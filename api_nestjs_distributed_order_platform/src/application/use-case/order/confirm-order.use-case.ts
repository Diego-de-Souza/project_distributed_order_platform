import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { OrderRepositoryInterface } from "src/application/port/order.repository";
import { OrderEntity } from "src/domain/entities/order.entity";
import { ORDER_REPOSITORY } from "src/shared/tokens_nest/order.token";

@Injectable()
export class ConfirmOrderUseCase {
    constructor(
        @Inject(ORDER_REPOSITORY)
        private readonly orderRepository: OrderRepositoryInterface,
    ) {}

    async execute(orderId: string): Promise<OrderEntity> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        try {
            order.confirmOrder();
        } catch (error) {
            throw new BadRequestException(
                error instanceof Error ? error.message : 'Unable to confirm order',
            );
        }

        await this.orderRepository.update(order);
        return order;
    }
}
