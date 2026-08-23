import { OrderEntity } from "src/domain/entities/order.entity";
import { Transaction } from "sequelize";

export interface OrderRepositoryInterface {
    create(order: OrderEntity, transaction?: Transaction): Promise<OrderEntity>;
    findById(orderId: string): Promise<OrderEntity | null>;
    findAll(): Promise<OrderEntity[]>;
    update(order: OrderEntity, transaction?: Transaction): Promise<void>;
    delete(orderId: string): Promise<void>;
}
