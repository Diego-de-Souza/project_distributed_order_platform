import { ReserveStockUseCase } from "@/application/use-case/stock/reserve-stock.use-case";
import { BadRequestException, Logger } from "@nestjs/common";
import { EventPublisherRepositoryInterface } from "src/application/port/event-publisher.repository";
import { StockRepositoryInterface } from "src/application/port/stock.repository";
import { StockEntity } from "src/domain/entities/stock.entity";

describe('ReserveStockUseCase', () => {
    let stockRepository: jest.Mocked<StockRepositoryInterface>;
    let eventPublisher: jest.Mocked<EventPublisherRepositoryInterface>;
    let useCase: ReserveStockUseCase;

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
        useCase = new ReserveStockUseCase(stockRepository, eventPublisher);
        jest.spyOn(Logger.prototype, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('reserves stock and publishes the reserved event', async () => {
        const stock = new StockEntity('product-1', 8, 2);
        stockRepository.reserve.mockResolvedValue(stock);
        eventPublisher.publishStockReserved.mockResolvedValue(undefined);

        const result = await useCase.execute('product-1', 2);

        expect(result).toBe(stock);
        expect(stockRepository.reserve).toHaveBeenCalledWith('product-1', 2);
        expect(eventPublisher.publishStockReserved).toHaveBeenCalledWith(stock);
    });

    it('throws BadRequestException when the repository cannot reserve', async () => {
        stockRepository.reserve.mockRejectedValue(new Error('Insufficient stock available'));

        await expect(useCase.execute('product-1', 99)).rejects.toThrow(BadRequestException);
        expect(eventPublisher.publishStockReserved).not.toHaveBeenCalled();
    });

    it('still returns the stock when publishing the event fails', async () => {
        const stock = new StockEntity('product-1', 8, 2);
        stockRepository.reserve.mockResolvedValue(stock);
        eventPublisher.publishStockReserved.mockRejectedValue(new Error('broker down'));

        const result = await useCase.execute('product-1', 2);

        expect(result).toBe(stock);
    });
});
