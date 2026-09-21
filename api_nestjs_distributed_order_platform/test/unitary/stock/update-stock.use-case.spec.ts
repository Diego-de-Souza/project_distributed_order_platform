import { UpdateStockUseCase } from "@/application/use-case/stock/update-stock.use-case";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { StockRepositoryInterface } from "src/application/port/stock.repository";
import { StockEntity } from "src/domain/entities/stock.entity";

describe('UpdateStockUseCase', () => {
    let stockRepository: jest.Mocked<StockRepositoryInterface>;
    let useCase: UpdateStockUseCase;

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
        useCase = new UpdateStockUseCase(stockRepository);
    });

    it('updates quantities using the current version', async () => {
        const stock = new StockEntity('product-1', 10, 2, 3);
        stockRepository.findByProductId.mockResolvedValue(stock);
        stockRepository.update.mockResolvedValue(true);

        const result = await useCase.execute({
            productId: 'product-1',
            availableQuantity: 20,
            reservedQuantity: 1,
        });

        expect(result).toBe(stock);
        expect(stock.getAvailableQuantity()).toBe(20);
        expect(stock.getReservedQuantity()).toBe(1);
        expect(stockRepository.update).toHaveBeenCalledWith(stock, 3);
    });

    it('keeps the current reserved quantity when it is omitted', async () => {
        const stock = new StockEntity('product-1', 10, 2, 1);
        stockRepository.findByProductId.mockResolvedValue(stock);
        stockRepository.update.mockResolvedValue(true);

        const result = await useCase.execute({
            productId: 'product-1',
            availableQuantity: 8,
        });

        expect(result.getReservedQuantity()).toBe(2);
        expect(result.getAvailableQuantity()).toBe(8);
    });

    it('throws NotFoundException when the stock does not exist', async () => {
        stockRepository.findByProductId.mockResolvedValue(null);

        await expect(
            useCase.execute({ productId: 'missing-id', availableQuantity: 1 }),
        ).rejects.toThrow(NotFoundException);
        expect(stockRepository.update).not.toHaveBeenCalled();
    });

    it('throws ConflictException when another request modified the stock', async () => {
        const stock = new StockEntity('product-1', 10, 0, 1);
        stockRepository.findByProductId.mockResolvedValue(stock);
        stockRepository.update.mockResolvedValue(false);

        await expect(
            useCase.execute({ productId: 'product-1', availableQuantity: 5 }),
        ).rejects.toThrow(ConflictException);
    });
});
