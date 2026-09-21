import { CancelOrderUseCase } from "@/application/use-case/order/cancel-order.use-case";
import { BadRequestException, Logger, NotFoundException } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { EventPublisherRepositoryInterface } from "src/application/port/event-publisher.repository";
import { OrderRepositoryInterface } from "src/application/port/order.repository";
import { StockRepositoryInterface } from "src/application/port/stock.repository";
import { OrderItemEntity } from "src/domain/entities/order-item.entity";
import { OrderEntity } from "src/domain/entities/order.entity";
import { StockEntity } from "src/domain/entities/stock.entity";
import { StatusOrder } from "src/shared/enums/status-order.enum";

describe('CancelOrderUseCase', () => {
    let orderRepository: jest.Mocked<OrderRepositoryInterface>;
    let stockRepository: jest.Mocked<StockRepositoryInterface>;
    let sequelize: { transaction: jest.Mock };
    let eventPublisher: jest.Mocked<EventPublisherRepositoryInterface>;
    let useCase: CancelOrderUseCase;

    beforeEach(() => {
        orderRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
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
        sequelize = {
            transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
                callback({}),
            ),
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
        useCase = new CancelOrderUseCase(
            orderRepository,
            stockRepository,
            sequelize as unknown as Sequelize,
            eventPublisher,
        );
        jest.spyOn(Logger.prototype, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('cancels a pending order, releases stock and publishes events', async () => {
        const order = new OrderEntity(
            'client-1',
            'order-1',
            [new OrderItemEntity('product-1', 2, 50)],
            StatusOrder.PENDING,
            100,
        );
        const releasedStock = new StockEntity('product-1', 10, 0);
        orderRepository.findById.mockResolvedValue(order);
        stockRepository.release.mockResolvedValue(releasedStock);
        orderRepository.update.mockResolvedValue(undefined);
        eventPublisher.publishCancelledOrder.mockResolvedValue(undefined);
        eventPublisher.publishStockReleased.mockResolvedValue(undefined);

        const result = await useCase.execute('order-1');

        expect(result.getStatus()).toBe(StatusOrder.CANCELLED);
        expect(stockRepository.release).toHaveBeenCalledWith('product-1', 2, {});
        expect(orderRepository.update).toHaveBeenCalledWith(order, {});
        expect(eventPublisher.publishCancelledOrder).toHaveBeenCalledWith(order);
        expect(eventPublisher.publishStockReleased).toHaveBeenCalledWith(releasedStock);
    });

    it('throws NotFoundException when the order does not exist', async () => {
        orderRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute('missing-id')).rejects.toThrow(NotFoundException);
        expect(sequelize.transaction).not.toHaveBeenCalled();
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
        expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    it('still returns the cancelled order when publishing events fails', async () => {
        const order = new OrderEntity(
            'client-1',
            'order-1',
            [new OrderItemEntity('product-1', 2, 50)],
            StatusOrder.PENDING,
            100,
        );
        orderRepository.findById.mockResolvedValue(order);
        stockRepository.release.mockResolvedValue(new StockEntity('product-1', 10, 0));
        orderRepository.update.mockResolvedValue(undefined);
        eventPublisher.publishCancelledOrder.mockRejectedValue(new Error('broker down'));
        eventPublisher.publishStockReleased.mockRejectedValue(new Error('broker down'));

        const result = await useCase.execute('order-1');

        expect(result.getStatus()).toBe(StatusOrder.CANCELLED);
    });
});
