import { Inject, Injectable } from "@nestjs/common";
import type { StockRepositoryInterface } from "src/application/port/stock.repository";
import { StockEntity } from "src/domain/entities/stock.entity";
import { STOCK_REPOSITORY } from "src/shared/tokens_nest/stock.token";

@Injectable()
export class ReserveStockUseCase {
    constructor(
        @Inject(STOCK_REPOSITORY)
        private readonly stockRepository: StockRepositoryInterface,
    ) {}

    async execute(productId: string, quantity: number): Promise<StockEntity> {
        return this.stockRepository.reserve(productId, quantity);
    }
}
