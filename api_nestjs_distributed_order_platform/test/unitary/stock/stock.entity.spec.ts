import { StockEntity } from "@/domain/entities/stock.entity";

describe('StockEntity', () => {
    describe('constructor', () => {
        it('should create a stock entity', () => {
            const stock = new StockEntity('product-1', 10, 2);

            expect(stock.getProductId()).toBe('product-1');
            expect(stock.getAvailableQuantity()).toBe(10);
            expect(stock.getReservedQuantity()).toBe(2);
            expect(stock.getVersion()).toBe(0);
        });

        it('throws if productId is missing', () => {
            expect(() => new StockEntity('', 10, 0)).toThrow('Product ID is required');
        });

        it('throws if availableQuantity is negative', () => {
            expect(() => new StockEntity('product-1', -1, 0)).toThrow(
                'Available quantity must be greater than or equal to 0',
            );
        });
    });

    describe('reserve', () => {
        it('moves quantity from available to reserved and bumps version', () => {
            const stock = new StockEntity('product-1', 10, 0);

            stock.reserve(3);

            expect(stock.getAvailableQuantity()).toBe(7);
            expect(stock.getReservedQuantity()).toBe(3);
            expect(stock.getVersion()).toBe(1);
        });

        it('throws if quantity is zero or negative', () => {
            const stock = new StockEntity('product-1', 10, 0);

            expect(() => stock.reserve(0)).toThrow('Quantity must be greater than 0');
            expect(() => stock.reserve(-5)).toThrow('Quantity must be greater than 0');
        });

        it('throws if there is not enough available stock', () => {
            const stock = new StockEntity('product-1', 2, 0);

            expect(() => stock.reserve(3)).toThrow('Insufficient stock available');
        });

        it('allows reserving exactly the full available quantity', () => {
            const stock = new StockEntity('product-1', 5, 0);

            stock.reserve(5);

            expect(stock.getAvailableQuantity()).toBe(0);
            expect(stock.getReservedQuantity()).toBe(5);
        });

        it('does not mutate state when it throws', () => {
            const stock = new StockEntity('product-1', 2, 0);

            expect(() => stock.reserve(3)).toThrow();
            // o estado precisa continuar exatamente como estava antes da
            // tentativa — uma operação que falha não pode deixar rastro
            expect(stock.getAvailableQuantity()).toBe(2);
            expect(stock.getReservedQuantity()).toBe(0);
            expect(stock.getVersion()).toBe(0);
        });
    });

    describe('release', () => {
        it('moves quantity from reserved back to available and bumps version', () => {
            const stock = new StockEntity('product-1', 5, 5);

            stock.release(2);

            expect(stock.getAvailableQuantity()).toBe(7);
            expect(stock.getReservedQuantity()).toBe(3);
            expect(stock.getVersion()).toBe(1);
        });

        it('throws if releasing more than what is reserved', () => {
            const stock = new StockEntity('product-1', 5, 2);

            expect(() => stock.release(3)).toThrow('Insufficient reserved stock to release');
        });
    });

    describe('consume', () => {
        it('reduces reserved quantity without touching available, and bumps version', () => {
            const stock = new StockEntity('product-1', 5, 3);

            stock.consume(3);

            expect(stock.getReservedQuantity()).toBe(0);
            expect(stock.getAvailableQuantity()).toBe(5); // proposital: consume não mexe em available
            expect(stock.getVersion()).toBe(1);
        });

        it('throws if consuming more than what is reserved', () => {
            const stock = new StockEntity('product-1', 5, 2);

            expect(() => stock.consume(3)).toThrow('Insufficient reserved stock');
        });
    });
});