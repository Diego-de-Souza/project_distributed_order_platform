import { StockEntity } from "src/domain/entities/stock.entity";
import { Transaction } from "sequelize";

export interface StockRepositoryInterface {
    create(stock: StockEntity): Promise<StockEntity>;
    findByProductId(
        productId: string,
        transaction?: Transaction,
    ): Promise<StockEntity | null>;
    findAll(): Promise<StockEntity[]>;
    update(
        stock: StockEntity,
        expectedVersion?: number,
        transaction?: Transaction,
    ): Promise<boolean>;
    delete(productId: string): Promise<void>;
    reserve(
        productId: string,
        quantity: number,
        transaction?: Transaction,
    ): Promise<StockEntity>;
    release(
        productId: string,
        quantity: number,
        transaction?: Transaction,
    ): Promise<StockEntity>;
}
