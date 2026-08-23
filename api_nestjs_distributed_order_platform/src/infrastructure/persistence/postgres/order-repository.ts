import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Transaction } from "sequelize";
import type { OrderRepositoryInterface } from "src/application/port/order.repository";
import { OrderItemEntity } from "src/domain/entities/order-item.entity";
import { OrderEntity } from "src/domain/entities/order.entity";
import { OrderItemModel } from "./models/order-item.model";
import { OrderModel } from "./models/order.model";

@Injectable()
export class OrderRepository implements OrderRepositoryInterface {
    constructor(
        @InjectModel(OrderModel) private readonly orderModel: typeof OrderModel,
        @InjectModel(OrderItemModel) private readonly orderItemModel: typeof OrderItemModel,
    ) {}

    async create(order: OrderEntity, transaction?: Transaction): Promise<OrderEntity> {
        const created = await this.orderModel.create(
            {
                client_id: order.getClientId(),
                total: order.getTotal(),
                status: order.getStatus(),
                created_at: new Date(),
                updated_at: new Date(),
                version: order.getVersion(),
            },
            { transaction },
        );

        const items = order.getItems();
        if (items.length > 0) {
            await this.orderItemModel.bulkCreate(
                items.map((item) => ({
                    order_id: created.id,
                    product_id: item.getProductId(),
                    quantity: item.getQuantity(),
                    unit_price: item.getUnitPrice(),
                    sub_total: item.getSubTotal(),
                })),
                { transaction },
            );
        }

        return this.findByIdOrThrow(created.id, transaction);
    }

    async findById(orderId: string): Promise<OrderEntity | null> {
        const order = await this.orderModel.findByPk(orderId, {
            include: [OrderItemModel],
        });

        return order ? this.toEntity(order) : null;
    }

    async findAll(): Promise<OrderEntity[]> {
        const orders = await this.orderModel.findAll({
            include: [OrderItemModel],
            order: [['created_at', 'DESC']],
        });

        return orders.map((order) => this.toEntity(order));
    }

    async update(order: OrderEntity, transaction?: Transaction): Promise<void> {
        await this.orderModel.update(
            {
                total: order.getTotal(),
                status: order.getStatus(),
                updated_at: new Date(),
                version: order.getVersion() + 1,
            },
            {
                where: { id: order.getId() },
                transaction,
            },
        );
    }

    async delete(orderId: string): Promise<void> {
        await this.orderItemModel.destroy({ where: { order_id: orderId } });
        await this.orderModel.destroy({ where: { id: orderId } });
    }

    private async findByIdOrThrow(
        orderId: string,
        transaction?: Transaction,
    ): Promise<OrderEntity> {
        const order = await this.orderModel.findByPk(orderId, {
            include: [OrderItemModel],
            transaction,
        });

        if (!order) {
            throw new Error('Order not found after create');
        }

        return this.toEntity(order);
    }

    private toEntity(order: OrderModel): OrderEntity {
        const items = (order.items ?? []).map(
            (item) =>
                new OrderItemEntity(
                    item.product_id,
                    item.quantity,
                    Number(item.unit_price),
                ),
        );

        return new OrderEntity(
            order.client_id,
            order.id,
            items,
            order.status,
            Number(order.total),
            order.version,
        );
    }
}
