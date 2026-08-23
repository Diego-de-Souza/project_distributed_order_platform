import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Transaction } from "sequelize";
import type { StockRepositoryInterface } from "src/application/port/stock.repository";
import { StockEntity } from "src/domain/entities/stock.entity";
import { StockModel } from "./models/stock.model";

@Injectable()
export class StockRepository implements StockRepositoryInterface {
    constructor(
        @InjectModel(StockModel) private readonly stockModel: typeof StockModel,
    ) {}

    async create(stock: StockEntity): Promise<StockEntity> {
        const created = await this.stockModel.create({
            product_id: stock.getProductId(),
            available_quantity: stock.getAvailableQuantity(),
            reserved_quantity: stock.getReservedQuantity(),
            version: stock.getVersion(),
        });

        return this.toEntity(created);
    }

    async findByProductId(productId: string): Promise<StockEntity | null> {
        const stock = await this.stockModel.findByPk(productId);
        return stock ? this.toEntity(stock) : null;
    }

    async findAll(): Promise<StockEntity[]> {
        const stocks = await this.stockModel.findAll();
        return stocks.map((stock) => this.toEntity(stock));
    }

    async update(stock: StockEntity, expectedVersion?: number): Promise<boolean> {
        const where: Record<string, unknown> = {
            product_id: stock.getProductId(),
        };

        if (expectedVersion !== undefined) {
            where.version = expectedVersion;
        }

        const [affected] = await this.stockModel.update(
            {
                available_quantity: stock.getAvailableQuantity(),
                reserved_quantity: stock.getReservedQuantity(),
                version: stock.getVersion(),
            },
            { where },
        );

        return affected > 0;
    }

    async delete(productId: string): Promise<void> {
        await this.stockModel.destroy({ where: { product_id: productId } });
    }

    async reserve(
        productId: string,
        quantity: number,
        transaction?: Transaction,
    ): Promise<StockEntity> {
        const stock = await this.loadForUpdate(productId, transaction);

        try {
            stock.reserve(quantity);
        } catch (error) {
            throw new ConflictException(
                error instanceof Error ? error.message : 'Unable to reserve stock',
            );
        }

        await this.persist(stock, transaction);
        return stock;
    }

    async release(
        productId: string,
        quantity: number,
        transaction?: Transaction,
    ): Promise<StockEntity> {
        const stock = await this.loadForUpdate(productId, transaction);

        try {
            stock.release(quantity);
        } catch (error) {
            throw new ConflictException(
                error instanceof Error ? error.message : 'Unable to release stock',
            );
        }

        await this.persist(stock, transaction);
        return stock;
    }

    private async loadForUpdate(
        productId: string,
        transaction?: Transaction,
    ): Promise<StockEntity> {
        const stockRow = await this.stockModel.findByPk(productId, {
            transaction,
            lock: transaction ? Transaction.LOCK.UPDATE : undefined,
        });

        if (!stockRow) {
            throw new NotFoundException(`Stock not found for product ${productId}`);
        }

        return this.toEntity(stockRow);
    }

    private async persist(
        stock: StockEntity,
        transaction?: Transaction,
    ): Promise<void> {
        await this.stockModel.update(
            {
                available_quantity: stock.getAvailableQuantity(),
                reserved_quantity: stock.getReservedQuantity(),
                version: stock.getVersion(),
            },
            {
                where: { product_id: stock.getProductId() },
                transaction,
            },
        );
    }

    private toEntity(stock: StockModel): StockEntity {
        return new StockEntity(
            stock.product_id,
            stock.available_quantity,
            stock.reserved_quantity,
            stock.version,
        );
    }
}
