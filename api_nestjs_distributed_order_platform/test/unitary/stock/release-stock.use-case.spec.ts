import { ReleaseStockUseCase } from "@/application/use-case/stock/release-stock.use-case";
import { BadRequestException, Logger } from "@nestjs/common";
import { EventPublisherRepositoryInterface } from "src/application/port/event-publisher.repository";
import { StockRepositoryInterface } from "src/application/port/stock.repository";
import { StockEntity } from "src/domain/entities/stock.entity";

describe('ReleaseStockUseCase', () => {
    let stockRepository: jest.Mocked<StockRepositoryInterface>;
    let eventPublisher: jest.Mocked<EventPublisherRepositoryInterface>;
    let useCase: ReleaseStockUseCase;

    beforeEach(() => {
        stockRepository = {
            create: jest.fn(),
            findByProductId: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            reserve: jest.fn(),
            release: jest.fn(),
        };
        eventPublisher = {
            publishCreatedOrder: jest.fn(),
            publishConfirmedOrder: jest.fn(),
            publishCancelledOrder: jest.fn(),
            publishPaymentPaid: jest.fn(),
            publishPaymentFailed: jest.fn(),
            publishStockReserved: jest.fn(),
            publishStockReleased: jest.fn(),
            publishStockConsumed: jest.fn(),
        };
        useCase = new ReleaseStockUseCase(stockRepository, eventPublisher);
        jest.spyOn(Logger.prototype, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('releases stock and publishes the released event', async () => {
        const stock = new StockEntity('product-1', 10, 0);
        stockRepository.release.mockResolvedValue(stock);
        eventPublisher.publishStockReleased.mockResolvedValue(undefined);

        const result = await useCase.execute('product-1', 2);

        expect(result).toBe(stock);
        expect(stockRepository.release).toHaveBeenCalledWith('product-1', 2);
        expect(eventPublisher.publishStockReleased).toHaveBeenCalledWith(stock);
    });

    it('throws BadRequestException when the repository cannot release', async () => {
        stockRepository.release.mockRejectedValue(
            new Error('Insufficient reserved stock to release'),
        );

        await expect(useCase.execute('product-1', 99)).rejects.toThrow(BadRequestException);
        expect(eventPublisher.publishStockReleased).not.toHaveBeenCalled();
    });

    it('still returns the stock when publishing the event fails', async () => {
        const stock = new StockEntity('product-1', 10, 0);
        stockRepository.release.mockResolvedValue(stock);
        eventPublisher.publishStockReleased.mockRejectedValue(new Error('broker down'));

        const result = await useCase.execute('product-1', 2);

        expect(result).toBe(stock);
    });
});
