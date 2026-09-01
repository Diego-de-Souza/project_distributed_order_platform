import { CreatePaymentUseCase } from "@/application/use-case/payment/create-payment.use-case";
import { BadRequestException, Logger, NotFoundException } from "@nestjs/common";
import { EventPublisherRepositoryInterface } from "src/application/port/event-publisher.repository";
import { OrderRepositoryInterface } from "src/application/port/order.repository";
import { PaymentGatewayInterface } from "src/application/port/payment-gateway.repository";
import { PaymentRepositoryInterface } from "src/application/port/payment.repository";
import { StockRepositoryInterface } from "src/application/port/stock.repository";
import { UnitOfWorkInterface } from "src/application/port/unit-of-work.respository";
import { OrderItemEntity } from "src/domain/entities/order-item.entity";
import { OrderEntity } from "src/domain/entities/order.entity";
import { PaymentEntity } from "src/domain/entities/payment.entity";
import { StockEntity } from "src/domain/entities/stock.entity";
import { StatusOrder } from "src/shared/enums/status-order.enum";
import { StatusPayment } from "src/shared/enums/status-payment.enum";

describe('CreatePaymentUseCase', () => {
    let paymentRepository: jest.Mocked<PaymentRepositoryInterface>;
    let orderRepository: jest.Mocked<OrderRepositoryInterface>;
    let uowPaymentRepository: jest.Mocked<PaymentRepositoryInterface>;
    let uowOrderRepository: jest.Mocked<OrderRepositoryInterface>;
    let uowStockRepository: jest.Mocked<StockRepositoryInterface>;
    let uow: jest.Mocked<UnitOfWorkInterface>;
    let gateway: jest.Mocked<PaymentGatewayInterface>;
    let eventPublisher: jest.Mocked<EventPublisherRepositoryInterface>;
    let useCase: CreatePaymentUseCase;
    const fakeTx = {} as never;

    const pendingOrder = () =>
        new OrderEntity(
            'client-1',
            'order-1',
            [new OrderItemEntity('product-1', 2, 50)],
            StatusOrder.PENDING,
            100,
        );

    beforeEach(() => {
        paymentRepository = {
            createPayment: jest.fn(),
            getPaymentById: jest.fn(),
            updatePayment: jest.fn(),
            deletePayment: jest.fn(),
        };
        orderRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        uowPaymentRepository = {
            createPayment: jest.fn(),
            getPaymentById: jest.fn(),
            updatePayment: jest.fn(),
            deletePayment: jest.fn(),
        };
        uowOrderRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        uowStockRepository = {
            create: jest.fn(),
            findByProductId: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            reserve: jest.fn(),
            release: jest.fn(),
        };
        uow = {
            begin: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            getTransaction: jest.fn().mockReturnValue(fakeTx),
            getPaymentRepository: jest.fn().mockReturnValue(uowPaymentRepository),
            getOrderRepository: jest.fn().mockReturnValue(uowOrderRepository),
            getStockRepository: jest.fn().mockReturnValue(uowStockRepository),
        };
        gateway = {
            createCharge: jest.fn(),
            retrieveCharge: jest.fn(),
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
        useCase = new CreatePaymentUseCase(
            paymentRepository,
            orderRepository,
            uow,
            gateway,
            eventPublisher,
        );
        jest.spyOn(Logger.prototype, 'error').mockImplementation();
        jest.spyOn(global, 'setTimeout').mockImplementation((callback: TimerHandler) => {
            if (typeof callback === 'function') {
                callback();
            }
            return 0 as unknown as NodeJS.Timeout;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('charges the gateway, consumes stock and marks the payment as paid', async () => {
        const order = pendingOrder();
        const createdPayment = new PaymentEntity('order-1', 100, StatusPayment.PENDING, 'payment-1');
        const stock = new StockEntity('product-1', 10, 2);

        orderRepository.findById.mockResolvedValue(order);
        paymentRepository.createPayment.mockResolvedValue(createdPayment);
        gateway.createCharge.mockResolvedValue({
            success: true,
            externalId: 'ext-1',
            status: 'paid',
            raw: { ok: true },
        });
        uow.begin.mockResolvedValue(undefined);
        uowStockRepository.findByProductId.mockResolvedValue(stock);
        uowStockRepository.update.mockResolvedValue(true);
        uowPaymentRepository.updatePayment.mockResolvedValue(undefined);
        uowOrderRepository.update.mockResolvedValue(undefined);
        uow.commit.mockResolvedValue(undefined);
        eventPublisher.publishStockConsumed.mockResolvedValue(undefined);
        eventPublisher.publishPaymentPaid.mockResolvedValue(undefined);

        const result = await useCase.execute({ order_id: 'order-1' });

        expect(result.getStatus()).toBe(StatusPayment.PAID);
        expect(result.getExternalId()).toBe('ext-1');
        expect(order.getStatus()).toBe(StatusOrder.CONFIRMED);
        expect(stock.getReservedQuantity()).toBe(0);
        expect(gateway.createCharge).toHaveBeenCalledWith({
            paymentId: 'payment-1',
            orderId: 'order-1',
            amount: 100,
            idempotencyKey: 'payment-1',
        });
        expect(uowStockRepository.update).toHaveBeenCalledWith(stock, undefined, fakeTx);
        expect(eventPublisher.publishStockConsumed).toHaveBeenCalledWith(stock);
        expect(eventPublisher.publishPaymentPaid).toHaveBeenCalledWith(createdPayment);
        expect(uow.commit).toHaveBeenCalled();
    });

    it('throws NotFoundException when the order does not exist', async () => {
        orderRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute({ order_id: 'missing-id' })).rejects.toThrow(
            NotFoundException,
        );
        expect(paymentRepository.createPayment).not.toHaveBeenCalled();
        expect(gateway.createCharge).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the order is not pending', async () => {
        orderRepository.findById.mockResolvedValue(
            new OrderEntity(
                'client-1',
                'order-1',
                [new OrderItemEntity('product-1', 1, 100)],
                StatusOrder.CONFIRMED,
                100,
            ),
        );

        await expect(useCase.execute({ order_id: 'order-1' })).rejects.toThrow(
            BadRequestException,
        );
    });

    it('throws BadRequestException when the order has no items', async () => {
        orderRepository.findById.mockResolvedValue(
            new OrderEntity('client-1', 'order-1', [], StatusOrder.PENDING, 0),
        );

        await expect(useCase.execute({ order_id: 'order-1' })).rejects.toThrow(
            BadRequestException,
        );
    });

    it('throws BadRequestException when the amount does not match the order total', async () => {
        orderRepository.findById.mockResolvedValue(pendingOrder());

        await expect(
            useCase.execute({ order_id: 'order-1', amount: 999 }),
        ).rejects.toThrow(BadRequestException);
        expect(paymentRepository.createPayment).not.toHaveBeenCalled();
    });

    it('releases stock and marks the payment as failed when the gateway rejects', async () => {
        const order = pendingOrder();
        const createdPayment = new PaymentEntity('order-1', 100, StatusPayment.PENDING, 'payment-1');
        const releasedStock = new StockEntity('product-1', 12, 0);

        orderRepository.findById.mockResolvedValue(order);
        paymentRepository.createPayment.mockResolvedValue(createdPayment);
        gateway.createCharge.mockResolvedValue({
            success: false,
            kind: 'BUSINESS',
            status: 'failed',
            errorCode: 'CARD_DECLINED',
            errorMessage: 'Card declined',
            raw: { declined: true },
        });
        uow.begin.mockResolvedValue(undefined);
        uowStockRepository.release.mockResolvedValue(releasedStock);
        uowPaymentRepository.updatePayment.mockResolvedValue(undefined);
        uowOrderRepository.update.mockResolvedValue(undefined);
        uow.commit.mockResolvedValue(undefined);
        eventPublisher.publishStockReleased.mockResolvedValue(undefined);
        eventPublisher.publishPaymentFailed.mockResolvedValue(undefined);

        const result = await useCase.execute({ order_id: 'order-1' });

        expect(result.getStatus()).toBe(StatusPayment.FAILED);
        expect(result.getLastErrorCode()).toBe('CARD_DECLINED');
        expect(order.getStatus()).toBe(StatusOrder.CANCELLED);
        expect(uowStockRepository.release).toHaveBeenCalledWith('product-1', 2, fakeTx);
        expect(eventPublisher.publishStockReleased).toHaveBeenCalledWith(releasedStock);
        expect(eventPublisher.publishPaymentFailed).toHaveBeenCalledWith(createdPayment);
        expect(eventPublisher.publishPaymentPaid).not.toHaveBeenCalled();
    });

    it('rolls back and rethrows when stock is missing after a successful charge', async () => {
        const order = pendingOrder();
        const createdPayment = new PaymentEntity('order-1', 100, StatusPayment.PENDING, 'payment-1');

        orderRepository.findById.mockResolvedValue(order);
        paymentRepository.createPayment.mockResolvedValue(createdPayment);
        gateway.createCharge.mockResolvedValue({
            success: true,
            externalId: 'ext-1',
            status: 'paid',
        });
        uow.begin.mockResolvedValue(undefined);
        uowStockRepository.findByProductId.mockResolvedValue(null);
        uow.rollback.mockResolvedValue(undefined);
        eventPublisher.publishPaymentFailed.mockResolvedValue(undefined);

        await expect(useCase.execute({ order_id: 'order-1' })).rejects.toThrow(
            NotFoundException,
        );
        expect(uow.rollback).toHaveBeenCalled();
        expect(eventPublisher.publishPaymentFailed).toHaveBeenCalledWith(createdPayment);
        expect(uow.commit).not.toHaveBeenCalled();
    });

    it('retries a retriable gateway result and then marks the payment as paid', async () => {
        const order = pendingOrder();
        const createdPayment = new PaymentEntity('order-1', 100, StatusPayment.PENDING, 'payment-1');
        const stock = new StockEntity('product-1', 10, 2);

        orderRepository.findById.mockResolvedValue(order);
        paymentRepository.createPayment.mockResolvedValue(createdPayment);
        gateway.createCharge.mockResolvedValue({
            success: false,
            kind: 'RETRIABLE',
            status: 'pending',
            errorCode: 'GATEWAY_UNAVAILABLE',
        });
        gateway.retrieveCharge.mockResolvedValue({
            success: true,
            externalId: 'ext-retry',
            status: 'paid',
            raw: { retried: true },
        });
        uow.begin.mockResolvedValue(undefined);
        uowStockRepository.findByProductId.mockResolvedValue(stock);
        uowStockRepository.update.mockResolvedValue(true);
        uowPaymentRepository.updatePayment.mockResolvedValue(undefined);
        uowOrderRepository.update.mockResolvedValue(undefined);
        uow.commit.mockResolvedValue(undefined);
        eventPublisher.publishStockConsumed.mockResolvedValue(undefined);
        eventPublisher.publishPaymentPaid.mockResolvedValue(undefined);

        const result = await useCase.execute({ order_id: 'order-1' });

        expect(gateway.retrieveCharge).toHaveBeenCalledWith({ idempotencyKey: 'payment-1' });
        expect(result.getStatus()).toBe(StatusPayment.PAID);
        expect(result.getExternalId()).toBe('ext-retry');
    });

    it('treats a non-retriable gateway exception as a business failure', async () => {
        const order = pendingOrder();
        const createdPayment = new PaymentEntity('order-1', 100, StatusPayment.PENDING, 'payment-1');
        const releasedStock = new StockEntity('product-1', 12, 0);

        orderRepository.findById.mockResolvedValue(order);
        paymentRepository.createPayment.mockResolvedValue(createdPayment);
        gateway.createCharge.mockRejectedValue(new Error('card declined'));
        uow.begin.mockResolvedValue(undefined);
        uowStockRepository.release.mockResolvedValue(releasedStock);
        uowPaymentRepository.updatePayment.mockResolvedValue(undefined);
        uowOrderRepository.update.mockResolvedValue(undefined);
        uow.commit.mockResolvedValue(undefined);
        eventPublisher.publishStockReleased.mockResolvedValue(undefined);
        eventPublisher.publishPaymentFailed.mockResolvedValue(undefined);

        const result = await useCase.execute({ order_id: 'order-1' });

        expect(result.getStatus()).toBe(StatusPayment.FAILED);
        expect(result.getLastErrorCode()).toBe('PAYMENT_REJECTED');
        expect(gateway.retrieveCharge).not.toHaveBeenCalled();
        expect(order.getStatus()).toBe(StatusOrder.CANCELLED);
    });
});
