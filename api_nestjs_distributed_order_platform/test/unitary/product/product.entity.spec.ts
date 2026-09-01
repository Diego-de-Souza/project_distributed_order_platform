import { ProductEntity } from "@/domain/entities/product.entity";
import { StatusProduct } from "src/shared/enums/status-product.enum";

describe('ProductEntity', () => {
    describe('constructor', () => {
        it('should create a product entity', () => {
            const product = new ProductEntity('sku-1', 'Product 1', 100);

            expect(product.getId()).toBeDefined();
            expect(product.getSku()).toBe('sku-1');
            expect(product.getName()).toBe('Product 1');
            expect(product.getPrice()).toBe(100);
            expect(product.getStatus()).toBe(StatusProduct.ACTIVE);
        });

        it('should create a product entity 2', () => {
            const product = new ProductEntity('sku-1', 'Product 1', 100, StatusProduct.ACTIVE, '1234567890');

            expect(product.getId()).toBe('1234567890');
            expect(product.getSku()).toBe('sku-1');
            expect(product.getName()).toBe('Product 1');
            expect(product.getPrice()).toBe(100);
            expect(product.getStatus()).toBe(StatusProduct.ACTIVE);

        });

        it('throws if sku is missing', () => {
            expect(() => new ProductEntity('', 'Product 1', 100)).toThrow('SKU is required');
        });

        it('throws if name is missing', () => {
            expect(() => new ProductEntity('sku-1', '', 100)).toThrow('Name is required');
        });
        
        it('throws if price is less than 0', () => {
            expect(() => new ProductEntity('sku-1', 'Product 1', -1)).toThrow('Price must be greater than 0');
        });
    });

    describe('canBeOrdered', () => {
        it('should return true if the product is active', () => {
            const product = new ProductEntity('sku-1', 'Product 1', 100, StatusProduct.ACTIVE);

            expect(product.canBeOrdered()).toBe(true);
        });

        it('should return false if the product is inactive', () => {
            const product = new ProductEntity('sku-1', 'Product 1', 100, StatusProduct.INACTIVE);
        });
    });
});