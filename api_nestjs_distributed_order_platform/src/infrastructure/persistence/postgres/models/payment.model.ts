import { Column, DataType, Model, Table } from "sequelize-typescript";
import { StatusPayment } from "src/shared/enums/status-payment.enum";
import { PaymentCreateAttributes } from "src/shared/interfaces/payment.interface";

@Table({
    tableName: 'payments',
    timestamps: false,
})
export class PaymentModel extends Model<PaymentCreateAttributes> {
    @Column({
        type: DataType.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataType.UUIDV4,
    })
    declare id: string;

    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare order_id: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    declare amount: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        defaultValue: StatusPayment.PENDING,
    })
    declare status: StatusPayment;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    declare attempts: number;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare last_error_message?: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare last_error_code?: string;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    declare gateway_raw_response?: unknown;

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
}
