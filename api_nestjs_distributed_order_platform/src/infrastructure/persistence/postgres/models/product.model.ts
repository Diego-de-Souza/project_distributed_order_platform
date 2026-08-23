import { Column, DataType, Model, Table } from "sequelize-typescript";
import { StatusProduct } from "src/shared/enums/status-product.enum";
import { ProductAttributes } from "src/shared/interfaces/product.interface";

@Table({
    tableName: 'product',
    timestamps: false,
})
export class ProductModel extends Model<ProductAttributes> {
    @Column({
        type: DataType.UUID,
        primaryKey: true,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true,
    })
    declare sku: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare name: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    declare price: number;

    @Column({
        type: DataType.ENUM(...Object.values(StatusProduct)),
        allowNull: false,
        defaultValue: StatusProduct.ACTIVE,
    })
    declare status: StatusProduct;
}
