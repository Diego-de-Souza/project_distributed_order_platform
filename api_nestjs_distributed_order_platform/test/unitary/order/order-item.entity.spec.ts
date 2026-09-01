import { OrderItemEntity } from "@/domain/entities/order-item.entity";

describe('OrderItemEntity', () => {
    describe('constructor', () => {
        it('should create a order item entity', () => {
            const orderItem = new OrderItemEntity('product-1', 10, 100);

            expect(orderItem.getProductId()).toBe('product-1');
            expect(orderItem.getQuantity()).toBe(10);
            expect(orderItem.getUnitPrice()).toBe(100);
        });

        it('throws if productId is missing', () => {
            expect(() => new OrderItemEntity('', 10, 100)).toThrow('Product ID is required');
        });

        it('throws if quantity is less than 0', () => {
            expect(() => new OrderItemEntity('product-1', -1, 100)).toThrow('Quantity must be greater than 0');
        });

        it('throws if unitPrice is less than 0', () => {
            expect(() => new OrderItemEntity('product-1', 10, -1)).toThrow('Unit price must be greater than 0');
        });
    });

});