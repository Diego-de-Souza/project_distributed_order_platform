import { Column, DataType, Model, Table } from "sequelize-typescript";
import { StockAttributes } from "src/shared/interfaces/stock.interface";

@Table({
    tableName: 'stock',
    timestamps: false,
})
export class StockModel extends Model<StockAttributes> {
    @Column({
        type: DataType.UUID,
        primaryKey: true,
    })
    declare product_id: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    declare available_quantity: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    declare reserved_quantity: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    declare version: number;
}
