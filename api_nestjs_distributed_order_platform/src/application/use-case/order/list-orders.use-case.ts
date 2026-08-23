import { Inject, Injectable } from "@nestjs/common";
import type { OrderRepositoryInterface } from "src/application/port/order.repository";
import { OrderEntity } from "src/domain/entities/order.entity";
import { ORDER_REPOSITORY } from "src/shared/tokens_nest/order.token";

@Injectable()
export class ListOrdersUseCase {
    constructor(
        @Inject(ORDER_REPOSITORY)
        private readonly orderRepository: OrderRepositoryInterface,
    ) {}

    async execute(): Promise<OrderEntity[]> {
        return this.orderRepository.findAll();
    }
}
