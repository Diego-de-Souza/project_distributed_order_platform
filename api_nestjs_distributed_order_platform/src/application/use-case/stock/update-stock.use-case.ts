import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { StockRepositoryInterface } from "src/application/port/stock.repository";
import { StockEntity } from "src/domain/entities/stock.entity";
import { UpdateStockInput } from "src/shared/interfaces/stock.interface";
import { STOCK_REPOSITORY } from "src/shared/tokens_nest/stock.token";

@Injectable()
export class UpdateStockUseCase {
    constructor(
        @Inject(STOCK_REPOSITORY)
        private readonly stockRepository: StockRepositoryInterface,
    ) {}

    async execute(input: UpdateStockInput): Promise<StockEntity> {
        const stock = await this.stockRepository.findByProductId(input.productId);
        if (!stock) {
            throw new NotFoundException('Stock not found');
        }

        const expectedVersion = stock.getVersion();
        stock.setQuantities(
            input.availableQuantity,
            input.reservedQuantity ?? stock.getReservedQuantity(),
        );

        const updated = await this.stockRepository.update(stock, expectedVersion);
        if (!updated) {
            throw new ConflictException('Stock was modified by another request');
        }

        return stock;
    }
}
