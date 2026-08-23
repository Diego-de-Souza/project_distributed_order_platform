import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { OrderItemAttributes } from "src/shared/interfaces/order-item.interface";
import { OrderModel } from "./order.model";

@Table({
    tableName: 'order_items',
    timestamps: false,
})
export class OrderItemModel extends Model<OrderItemAttributes> {
    @Column({
        type: DataType.UUID,
        primaryKey: true,
        defaultValue: DataType.UUIDV4,
    })
    declare id: string;

    @ForeignKey(() => OrderModel)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare order_id: string;

    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare product_id: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare quantity: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    declare unit_price: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    declare sub_total: number;

    @BelongsTo(() => OrderModel)
    declare order?: OrderModel;
}
