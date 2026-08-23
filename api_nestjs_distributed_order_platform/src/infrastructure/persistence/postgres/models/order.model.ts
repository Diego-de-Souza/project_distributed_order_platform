import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import { StatusOrder } from "src/shared/enums/status-order.enum";
import { OrderAttributes } from "src/shared/interfaces/order.interface";
import { OrderItemModel } from "./order-item.model";

@Table({
    tableName: 'order',
    timestamps: false,
})
export class OrderModel extends Model<OrderAttributes> {
    @Column({
        type: DataType.UUID,
        primaryKey: true,
        defaultValue: DataType.UUIDV4,
    })
    declare id: string;

    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare client_id: string;

    @Column({
        type: DataType.ENUM(...Object.values(StatusOrder)),
        allowNull: false,
        defaultValue: StatusOrder.PENDING,
    })
    declare status: StatusOrder;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    declare total: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    declare created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    declare updated_at: Date;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    declare version: number;

    @HasMany(() => OrderItemModel)
    declare items?: OrderItemModel[];
}
