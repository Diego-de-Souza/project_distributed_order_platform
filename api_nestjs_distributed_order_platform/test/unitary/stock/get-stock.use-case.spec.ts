import { GetStockUseCase } from "@/application/use-case/stock/get-stock.use-case";
import { NotFoundException } from "@nestjs/common";
import { StockRepositoryInterface } from "src/application/port/stock.repository";
import { StockEntity } from "src/domain/entities/stock.entity";

describe('GetStockUseCase', () => {
    let stockRepository: jest.Mocked<StockRepositoryInterface>;
    let useCase: GetStockUseCase;

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
        useCase = new GetStockUseCase(stockRepository);
    });

    it('returns the stock from the repository', async () => {
        const stock = new StockEntity('product-1', 10, 2);
        stockRepository.findByProductId.mockResolvedValue(stock);

        const result = await useCase.execute('product-1');

        expect(result).toBe(stock);
        expect(stockRepository.findByProductId).toHaveBeenCalledWith('product-1');
    });

    it('throws NotFoundException when the stock does not exist', async () => {
        stockRepository.findByProductId.mockResolvedValue(null);

        await expect(useCase.execute('missing-id')).rejects.toThrow(NotFoundException);
    });
});
