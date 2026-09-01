import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { EventPublisherRepositoryInterface } from "src/application/port/event-publisher.repository";
import type { OrderRepositoryInterface } from "src/application/port/order.repository";
import { OrderEntity } from "src/domain/entities/order.entity";
import { ORDER_REPOSITORY } from "src/shared/tokens_nest/order.token";
import { EVENT_PUBLISHER } from "src/shared/tokens_nest/rabbitmq.token";

@Injectable()
export class ConfirmOrderUseCase {
    private readonly logger = new Logger(ConfirmOrderUseCase.name);

    constructor(
        @Inject(ORDER_REPOSITORY)
        private readonly orderRepository: OrderRepositoryInterface,
        @Inject(EVENT_PUBLISHER)
        private readonly eventPublisher: EventPublisherRepositoryInterface,
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

        try{
            await this.eventPublisher.publishConfirmedOrder(order);
        }catch(error){
            this.logger.error(
                `Failed to publish ConfirmedOrder for order ${order.getId()}`,
                error instanceof Error ? error.stack : String(error),
            );
        }
        
        return order;
    }
}
