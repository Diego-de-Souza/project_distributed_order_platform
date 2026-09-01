import { OrderEntity } from "@/domain/entities/order.entity";
import { OrderItemEntity } from "src/domain/entities/order-item.entity";
import { StatusOrder } from "src/shared/enums/status-order.enum";

describe('OrderEntity', () => {
    describe('constructor', () => {
        it('should create a order entity', () => {
            const order = new OrderEntity('hashid1234');

            expect(order.getId()).toBeDefined();
            expect(order.getClientId()).toBe('hashid1234');
            expect(order.getVersion()).toBe(0);
        });

        it('should create a order entity 2', () => {
            const order = new OrderEntity('hashid1234', '1234567890', [new OrderItemEntity('product-1', 10, 100)], StatusOrder.PENDING, 100);

            expect(order.getId()).toBe('1234567890');
            expect(order.getClientId()).toBe('hashid1234');
            expect(order.getVersion()).toBe(0);
            expect(order.getItems()).toEqual([new OrderItemEntity('product-1', 10, 100)]);
            expect(order.getStatus()).toBe(StatusOrder.PENDING);
            expect(order.getTotal()).toBe(100);
        });

        it('throws if clientId is missing', () => {
            expect(() => new OrderEntity('')).toThrow('Client ID is required');
        });

    });

    describe('addItem', () => {
        it('should add a item to the order', () => {
            const order = new OrderEntity('hashid1234', '1234567890', [new OrderItemEntity('product-1', 10, 100)], StatusOrder.PENDING, 100);

            order.addItem(new OrderItemEntity('product-2', 20, 200));

            expect(order.getItems()).toEqual([new OrderItemEntity('product-1', 10, 100), new OrderItemEntity('product-2', 20, 200)]);
            expect(order.getTotal()).toBe(5000);
            expect(order.getVersion()).toBe(1);
        });

        it('throws if item is missing', () => {
            const order = new OrderEntity('hashid1234', '1234567890', [new OrderItemEntity('product-1', 10, 100)], StatusOrder.PENDING, 100);

            expect(() => order.addItem(new OrderItemEntity('', 20, 200))).toThrow('Product ID is required');
            expect(() => order.addItem(new OrderItemEntity('product-2', 0, 200))).toThrow('Quantity must be greater than 0');
            expect(() => order.addItem(new OrderItemEntity('product-2', 20, -1))).toThrow('Unit price must be greater than 0');
        });
    });

    describe('removeItem', () => {
        it('should remove a item from the order', () => {
            const order = new OrderEntity('hashid1234', '1234567890', [new OrderItemEntity('product-1', 10, 100), new OrderItemEntity('product-2', 20, 200)], StatusOrder.PENDING, 300);

            order.removeItem('product-1');

            expect(order.getItems()).toEqual([new OrderItemEntity('product-2', 20, 200)]);
            expect(order.getTotal()).toBe(4000);
            expect(order.getVersion()).toBe(1);
        });

        it('throws if item is not found', () => {
            const order = new OrderEntity('hashid1234', '1234567890', [new OrderItemEntity('product-1', 10, 100), new OrderItemEntity('product-2', 20, 200)], StatusOrder.PENDING, 300);

            expect(() => order.removeItem('product-3')).toThrow('Item not found in order');
        });
    });

    describe('confirmOrder', () => {
        it('should confirm the order', () => {
            const order = new OrderEntity('hashid1234', '1234567890', [new OrderItemEntity('product-1', 10, 100), new OrderItemEntity('product-2', 20, 200)], StatusOrder.PENDING, 300);

            order.confirmOrder();

            expect(order.getStatus()).toBe(StatusOrder.CONFIRMED);
            expect(order.getVersion()).toBe(1);
        });
    });

    describe('cancelOrder', () => {
        it('should cancel the order', () => {
            const order = new OrderEntity('hashid1234', '1234567890', [new OrderItemEntity('product-1', 10, 100), new OrderItemEntity('product-2', 20, 200)], StatusOrder.PENDING, 300);

            order.cancelOrder();

            expect(order.getStatus()).toBe(StatusOrder.CANCELLED);
            expect(order.getVersion()).toBe(1);
        });
    });

    describe('registerPaymentFailure', () => {
        it('should register a payment failure', () => {
            const order = new OrderEntity('hashid1234', '1234567890', [new OrderItemEntity('product-1', 10, 100), new OrderItemEntity('product-2', 20, 200)], StatusOrder.PENDING, 300);

            order.registerPaymentFailure('payment-error', 'Payment error');

            expect(order.getStatus()).toBe(StatusOrder.CANCELLED);
            expect(order.getVersion()).toBe(1);
        });
    });
});