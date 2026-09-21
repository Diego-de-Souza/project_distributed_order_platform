import { GetProductUseCase } from "@/application/use-case/product/get-product.use-case";
import { NotFoundException } from "@nestjs/common";
import { ProductRepositoryInterface } from "src/application/port/product.repository";
import { CacheStoreInterface } from "src/application/port/redis-store.repository";
import { ProductEntity } from "src/domain/entities/product.entity";
import { StatusProduct } from "src/shared/enums/status-product.enum";

describe('GetProductUseCase', () => {
    let productRepository: jest.Mocked<ProductRepositoryInterface>;
    let cacheStore: jest.Mocked<CacheStoreInterface>;
    let useCase: GetProductUseCase;

    beforeEach(() => {
        productRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findBySku: jest.fn(),
        };

        cacheStore = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        };

        useCase = new GetProductUseCase(productRepository, cacheStore);
    });

    it('returns the product from cache without touching the repository', async () => {
        cacheStore.get.mockResolvedValue({
            sku: 'sku-1',
            name: 'Product 1',
            price: 100,
            status: StatusProduct.ACTIVE,
            id: 'product-1',
        });

        const result = await useCase.execute('product-1');

        expect(result).toBeInstanceOf(ProductEntity);
        expect(result.getSku()).toBe('sku-1');
        expect(cacheStore.get).toHaveBeenCalledWith('product:product-1');
        expect(productRepository.findById).not.toHaveBeenCalled();
        expect(cacheStore.set).not.toHaveBeenCalled();
    });

    it('falls back to the repository on cache miss and populates the cache', async () => {
        cacheStore.get.mockResolvedValue(null);
        const product = new ProductEntity('sku-1', 'Product 1', 100, StatusProduct.ACTIVE, 'product-1');
        productRepository.findById.mockResolvedValue(product);

        const result = await useCase.execute('product-1');

        expect(result).toBe(product);
        expect(productRepository.findById).toHaveBeenCalledWith('product-1');
        expect(cacheStore.set).toHaveBeenCalledWith(
            'product:product-1',
            { sku: 'sku-1', name: 'Product 1', price: 100, status: StatusProduct.ACTIVE, id: 'product-1' },
            300,
        );
    });

    it('throws NotFoundException when the product does not exist anywhere', async () => {
        cacheStore.get.mockResolvedValue(null);
        productRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute('missing-id')).rejects.toThrow(NotFoundException);
        expect(cacheStore.set).not.toHaveBeenCalled();
    });
});