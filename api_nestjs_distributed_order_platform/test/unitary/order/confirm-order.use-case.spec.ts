import { ConfirmOrderUseCase } from "@/application/use-case/order/confirm-order.use-case";
import { BadRequestException, Logger, NotFoundException } from "@nestjs/common";
import { EventPublisherRepositoryInterface } from "src/application/port/event-publisher.repository";
import { OrderRepositoryInterface } from "src/application/port/order.repository";
import { OrderItemEntity } from "src/domain/entities/order-item.entity";
import { OrderEntity } from "src/domain/entities/order.entity";
import { StatusOrder } from "src/shared/enums/status-order.enum";

describe('ConfirmOrderUseCase', () => {
    let orderRepository: jest.Mocked<OrderRepositoryInterface>;
    let eventPublisher: jest.Mocked<EventPublisherRepositoryInterface>;
    let useCase: ConfirmOrderUseCase;

    beforeEach(() => {
        orderRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
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
        useCase = new ConfirmOrderUseCase(orderRepository, eventPublisher);
        jest.spyOn(Logger.prototype, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('confirms a pending order, persists it and publishes the event', async () => {
        const order = new OrderEntity(
            'client-1',
            'order-1',
            [new OrderItemEntity('product-1', 1, 100)],
            StatusOrder.PENDING,
            100,
        );
        orderRepository.findById.mockResolvedValue(order);
        orderRepository.update.mockResolvedValue(undefined);
        eventPublisher.publishConfirmedOrder.mockResolvedValue(undefined);

        const result = await useCase.execute('order-1');

        expect(result.getStatus()).toBe(StatusOrder.CONFIRMED);
        expect(orderRepository.findById).toHaveBeenCalledWith('order-1');
        expect(orderRepository.update).toHaveBeenCalledWith(order);
        expect(eventPublisher.publishConfirmedOrder).toHaveBeenCalledWith(order);
    });

    it('throws NotFoundException when the order does not exist', async () => {
        orderRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute('missing-id')).rejects.toThrow(NotFoundException);
        expect(orderRepository.update).not.toHaveBeenCalled();
        expect(eventPublisher.publishConfirmedOrder).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the order is not pending', async () => {
        const order = new OrderEntity(
            'client-1',
            'order-1',
            [new OrderItemEntity('product-1', 1, 100)],
            StatusOrder.CONFIRMED,
            100,
        );
        orderRepository.findById.mockResolvedValue(order);

        await expect(useCase.execute('order-1')).rejects.toThrow(BadRequestException);
        expect(orderRepository.update).not.toHaveBeenCalled();
    });

    it('still returns the confirmed order when publishing the event fails', async () => {
        const order = new OrderEntity(
            'client-1',
            'order-1',
            [new OrderItemEntity('product-1', 1, 100)],
            StatusOrder.PENDING,
            100,
        );
        orderRepository.findById.mockResolvedValue(order);
        orderRepository.update.mockResolvedValue(undefined);
        eventPublisher.publishConfirmedOrder.mockRejectedValue(new Error('broker down'));

        const result = await useCase.execute('order-1');

        expect(result.getStatus()).toBe(StatusOrder.CONFIRMED);
    });
});
