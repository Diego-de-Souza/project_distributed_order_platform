import { PaymentEntity } from "@/domain/entities/payment.entity";
import { StatusPayment } from "src/shared/enums/status-payment.enum";

describe('PaymentEntity', () => {
    describe('constructor', () => {
        it('should create a payment entity', () => {
            const payment = new PaymentEntity('1234567890', 100);

            expect(payment.getId()).toBeDefined();
            expect(payment.getOrderId()).toBe('1234567890');
            expect(payment.getAmount()).toBe(100);
            expect(payment.getStatus()).toBe(StatusPayment.PENDING);
        });

        it('should create a payment entity 2', () => {
            const payment = new PaymentEntity('1234567890', 100, StatusPayment.AUTHORIZED, '1234567890');

            expect(payment.getId()).toBe('1234567890');
            expect(payment.getOrderId()).toBe('1234567890');
            expect(payment.getAmount()).toBe(100);
            expect(payment.getStatus()).toBe(StatusPayment.AUTHORIZED);
        });

        it('throws if orderId is missing', () => {
            expect(() => new PaymentEntity('', 100, StatusPayment.PENDING, '1234567890')).toThrow('Order ID is required');
        });

        it('throws if amount is less than 0', () => {
            expect(() => new PaymentEntity('1234567890', -1)).toThrow('Amount must be greater than zero');
        });
    });

    describe('markAsPaid', () => {
        it('should mark a payment as paid', () => {
            const payment = new PaymentEntity('1234567890', 100, StatusPayment.PENDING, '1234567890');

            payment.markAsPaid('1234567890', 'Payment authorized');

            expect(payment.getStatus()).toBe(StatusPayment.PAID);
            expect(payment.getExternalId()).toBe('1234567890');
            expect(payment.getGatewayRawResponse()).toBe('Payment authorized');
        });

        it('throws if externalId is missing', () => {
            const payment = new PaymentEntity('1234567890', 100, StatusPayment.AUTHORIZED, '1234567890');

            expect(() => payment.markAsPaid('', 'Payment authorized')).toThrow('External ID is required');
        });
    });

    describe('markAsFailed', () => {
        it('should mark a payment as failed', () => {
            const payment = new PaymentEntity('1234567890', 100, StatusPayment.PENDING, '1234567890');

            payment.markAsFailed('1234567890', 'Payment failed');

            expect(payment.getStatus()).toBe(StatusPayment.FAILED);
            expect(payment.getLastErrorCode()).toBe('1234567890');
        });

        it('throws if payment is not pending', () => {
            const payment = new PaymentEntity('1234567890', 100, StatusPayment.AUTHORIZED, '1234567890');

            expect(() => payment.markAsFailed('1234567890', 'Payment failed')).toThrow('Payment is not pending');
        });

        it('throws if errorCode is missing', () => {
            const payment = new PaymentEntity('1234567890', 100, StatusPayment.PENDING, '1234567890');

            expect(() => payment.markAsFailed('', 'Payment failed')).toThrow('Error code is required');
        });

        it('throws if errorMessage is missing', () => {
            const payment = new PaymentEntity('1234567890', 100, StatusPayment.PENDING, '1234567890');

            expect(() => payment.markAsFailed('1234567890', '')).toThrow('Error message is required');
        });
    });

    describe('withId', () => {
        it('should return a payment entity with a new id', () => {
            const payment = new PaymentEntity('1234567890', 100, StatusPayment.PENDING, '1234567890');

            const newPayment = payment.withId('1234567891');

            expect(newPayment.getId()).toBe('1234567891');
        });

        it('should return a payment entity with the same properties', () => {
            const payment = new PaymentEntity('1234567890', 100, StatusPayment.PENDING, '1234567890');

            const newPayment = payment.withId('1234567891');

            expect(newPayment.getOrderId()).toBe('1234567890');
        });

        it('should return a payment entity with the same properties', () => {
            const payment = new PaymentEntity('1234567890', 100, StatusPayment.PENDING, '1234567890');

            const newPayment = payment.withId('1234567891');

            expect(newPayment.getAmount()).toBe(100);
        });

        it('should return a payment entity with the same properties', () => {
            const payment = new PaymentEntity('1234567890', 100, StatusPayment.PENDING, '1234567890');

            const newPayment = payment.withId('1234567891');

            expect(newPayment.getStatus()).toBe(StatusPayment.PENDING);
        });
    });	
});