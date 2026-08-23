import { Table, Model, Column, DataType } from "sequelize-typescript";
import { StatusClient } from "src/shared/enums/status-client.enum";
import type { ClientAttributes } from "src/shared/interfaces/client.interface";

@Table({ tableName: 'client' })
export class ClientModel extends Model<ClientAttributes> {
    @Column({
        type: DataType.UUID,
        primaryKey: true,
        defaultValue: DataType.UUIDV4,
    })
    declare id?: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    name!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    email!: string;

    @Column({
        type: DataType.ENUM(...Object.values(StatusClient)),
        allowNull: false,
        defaultValue: StatusClient.ACTIVE,
    })
    status!: StatusClient;
    
    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at!: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    updated_at!: Date;
}