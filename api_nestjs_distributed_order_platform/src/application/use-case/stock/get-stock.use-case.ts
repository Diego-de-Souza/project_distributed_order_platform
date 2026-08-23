import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { StockRepositoryInterface } from "src/application/port/stock.repository";
import { StockEntity } from "src/domain/entities/stock.entity";
import { STOCK_REPOSITORY } from "src/shared/tokens_nest/stock.token";

@Injectable()
export class GetStockUseCase {
    constructor(
        @Inject(STOCK_REPOSITORY)
        private readonly stockRepository: StockRepositoryInterface,
    ) {}

    async execute(productId: string): Promise<StockEntity> {
        const stock = await this.stockRepository.findByProductId(productId);
        if (!stock) {
            throw new NotFoundException('Stock not found');
        }
        return stock;
    }
}
