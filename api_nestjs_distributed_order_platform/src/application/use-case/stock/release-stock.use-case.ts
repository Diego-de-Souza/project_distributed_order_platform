import { BadRequestException, Inject, Injectable, Logger } from "@nestjs/common";
import type { EventPublisherRepositoryInterface } from "src/application/port/event-publisher.repository";
import type { StockRepositoryInterface } from "src/application/port/stock.repository";
import { StockEntity } from "src/domain/entities/stock.entity";
import { EVENT_PUBLISHER } from "src/shared/tokens_nest/rabbitmq.token";
import { STOCK_REPOSITORY } from "src/shared/tokens_nest/stock.token";

@Injectable()
export class ReleaseStockUseCase {
    private readonly logger = new Logger(ReleaseStockUseCase.name);
    
    constructor(
        @Inject(STOCK_REPOSITORY)
        private readonly stockRepository: StockRepositoryInterface,
        @Inject(EVENT_PUBLISHER)
        private readonly eventPublisher: EventPublisherRepositoryInterface,
    ) {}

    async execute(productId: string, quantity: number): Promise<StockEntity> {
        let stock: StockEntity;
        try {
            stock = await this.stockRepository.release(productId, quantity);
        } catch (error) {
            throw new BadRequestException(
                error instanceof Error ? error.message : 'Unable to release stock',
            );
        }
        try {
            await this.eventPublisher.publishStockReleased(stock);
        } catch (error) {
            this.logger.error(
                `Failed to publish StockReleased for product ${productId}`,
                error instanceof Error ? error.stack : String(error),
            );
        }

        return stock;
    }
}
