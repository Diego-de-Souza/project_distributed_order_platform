import { CreateProductUseCase } from "@/application/use-case/product/create-product.use-case";
import { ConflictException } from "@nestjs/common";
import { ProductRepositoryInterface } from "src/application/port/product.repository";
import { StockRepositoryInterface } from "src/application/port/stock.repository";
import { ProductEntity } from "src/domain/entities/product.entity";
import { StockEntity } from "src/domain/entities/stock.entity";
import { StatusProduct } from "src/shared/enums/status-product.enum";

describe('CreateProductUseCase', () => {
    let productRepository: jest.Mocked<ProductRepositoryInterface>;
    let stockRepository: jest.Mocked<StockRepositoryInterface>;
    let useCase: CreateProductUseCase;

    beforeEach(() => {
        productRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findBySku: jest.fn(),
        };
        stockRepository = {
            create: jest.fn(),
            findByProductId: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            reserve: jest.fn(),
            release: jest.fn(),
        };
        useCase = new CreateProductUseCase(productRepository, stockRepository);
    });

    it('creates a product and its initial stock', async () => {
        productRepository.findBySku.mockResolvedValue(null);
        const created = new ProductEntity(
            'sku-1',
            'Product 1',
            100,
            StatusProduct.ACTIVE,
            'product-1',
        );
        productRepository.create.mockResolvedValue(created);
        stockRepository.create.mockResolvedValue(new StockEntity('product-1', 5, 0));

        const result = await useCase.execute({
            sku: 'sku-1',
            name: 'Product 1',
            price: 100,
            status: StatusProduct.ACTIVE,
            initialStock: 5,
        });

        expect(result).toBe(created);
        expect(productRepository.findBySku).toHaveBeenCalledWith('sku-1');
        expect(productRepository.create).toHaveBeenCalledTimes(1);
        expect(stockRepository.create).toHaveBeenCalledTimes(1);
        const persistedStock = stockRepository.create.mock.calls[0][0];
        expect(persistedStock).toBeInstanceOf(StockEntity);
        expect(persistedStock.getProductId()).toBe('product-1');
        expect(persistedStock.getAvailableQuantity()).toBe(5);
        expect(persistedStock.getReservedQuantity()).toBe(0);
    });

    it('defaults initial stock to 0 when it is omitted', async () => {
        productRepository.findBySku.mockResolvedValue(null);
        const created = new ProductEntity(
            'sku-1',
            'Product 1',
            100,
            StatusProduct.ACTIVE,
            'product-1',
        );
        productRepository.create.mockResolvedValue(created);
        stockRepository.create.mockResolvedValue(new StockEntity('product-1', 0, 0));

        await useCase.execute({
            sku: 'sku-1',
            name: 'Product 1',
            price: 100,
        });

        const persistedStock = stockRepository.create.mock.calls[0][0];
        expect(persistedStock.getAvailableQuantity()).toBe(0);
    });

    it('throws ConflictException when the SKU already exists', async () => {
        productRepository.findBySku.mockResolvedValue(
            new ProductEntity('sku-1', 'Existing', 50, StatusProduct.ACTIVE, 'product-1'),
        );

        await expect(
            useCase.execute({
                sku: 'sku-1',
                name: 'Product 1',
                price: 100,
            }),
        ).rejects.toThrow(ConflictException);
        expect(productRepository.create).not.toHaveBeenCalled();
        expect(stockRepository.create).not.toHaveBeenCalled();
    });
});
