import { BadRequestException, Inject, Injectable, Logger } from "@nestjs/common";
import type { EventPublisherRepositoryInterface } from "src/application/port/event-publisher.repository";
import type { StockRepositoryInterface } from "src/application/port/stock.repository";
import { StockEntity } from "src/domain/entities/stock.entity";
import { EVENT_PUBLISHER } from "src/shared/tokens_nest/rabbitmq.token";
import { STOCK_REPOSITORY } from "src/shared/tokens_nest/stock.token";

@Injectable()
export class ReserveStockUseCase {
    private readonly logger = new Logger(ReserveStockUseCase.name);
    
    constructor(
        @Inject(STOCK_REPOSITORY)
        private readonly stockRepository: StockRepositoryInterface,
        @Inject(EVENT_PUBLISHER)
        private readonly eventPublisher: EventPublisherRepositoryInterface,
    ) {}

    async execute(productId: string, quantity: number): Promise<StockEntity> {
        let stock: StockEntity;
        try {
            stock = await this.stockRepository.reserve(productId, quantity);
        } catch (error) {
            throw new BadRequestException(
                error instanceof Error ? error.message : 'Unable to reserve stock',
            );
        }

   
        try {
            await this.eventPublisher.publishStockReserved(stock);
        } catch (error) {
            this.logger.error(
                `Failed to publish StockReserved for product ${productId}`,
                error instanceof Error ? error.stack : String(error),
            );
        }

        return stock;
    }
}
