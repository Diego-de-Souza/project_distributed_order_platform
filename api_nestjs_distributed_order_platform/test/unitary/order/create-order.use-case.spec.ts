import { CreateOrderUseCase } from "@/application/use-case/order/create-order.use-case";
import { BadRequestException, Logger, NotFoundException } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { ClientRepositoryInterface } from "src/application/port/client.repository";
import { EventPublisherRepositoryInterface } from "src/application/port/event-publisher.repository";
import { OrderRepositoryInterface } from "src/application/port/order.repository";
import { ProductRepositoryInterface } from "src/application/port/product.repository";
import { StockRepositoryInterface } from "src/application/port/stock.repository";
import { ClientEntity } from "src/domain/entities/client.entity";
import { OrderItemEntity } from "src/domain/entities/order-item.entity";
import { OrderEntity } from "src/domain/entities/order.entity";
import { ProductEntity } from "src/domain/entities/product.entity";
import { StockEntity } from "src/domain/entities/stock.entity";
import { StatusClient } from "src/shared/enums/status-client.enum";
import { StatusOrder } from "src/shared/enums/status-order.enum";
import { StatusProduct } from "src/shared/enums/status-product.enum";

describe('CreateOrderUseCase', () => {
    let orderRepository: jest.Mocked<OrderRepositoryInterface>;
    let clientRepository: jest.Mocked<ClientRepositoryInterface>;
    let productRepository: jest.Mocked<ProductRepositoryInterface>;
    let stockRepository: jest.Mocked<StockRepositoryInterface>;
    let sequelize: { transaction: jest.Mock };
    let eventPublisher: jest.Mocked<EventPublisherRepositoryInterface>;
    let useCase: CreateOrderUseCase;

    beforeEach(() => {
        orderRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        clientRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
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
        useCase = new CreateOrderUseCase(
            orderRepository,
            clientRepository,
            productRepository,
            stockRepository,
            sequelize as unknown as Sequelize,
            eventPublisher,
        );
        jest.spyOn(Logger.prototype, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('creates an order, reserves stock and publishes events', async () => {
        const client = new ClientEntity(
            'Client 1',
            'client1@example.com',
            StatusClient.ACTIVE,
            'client-1',
        );
        const product = new ProductEntity(
            'sku-1',
            'Product 1',
            100,
            StatusProduct.ACTIVE,
            'product-1',
        );
        const reservedStock = new StockEntity('product-1', 8, 2);
        const createdOrder = new OrderEntity(
            'client-1',
            'order-1',
            [new OrderItemEntity('product-1', 2, 100)],
            StatusOrder.PENDING,
            200,
        );

        clientRepository.findById.mockResolvedValue(client);
        productRepository.findById.mockResolvedValue(product);
        stockRepository.reserve.mockResolvedValue(reservedStock);
        orderRepository.create.mockResolvedValue(createdOrder);
        eventPublisher.publishCreatedOrder.mockResolvedValue(undefined);
        eventPublisher.publishStockReserved.mockResolvedValue(undefined);

        const result = await useCase.execute({
            clientId: 'client-1',
            items: [{ productId: 'product-1', quantity: 2 }],
        });

        expect(result).toBe(createdOrder);
        expect(stockRepository.reserve).toHaveBeenCalledWith('product-1', 2, {});
        expect(orderRepository.create).toHaveBeenCalledTimes(1);
        const persistedOrder = orderRepository.create.mock.calls[0][0];
        expect(persistedOrder.getClientId()).toBe('client-1');
        expect(persistedOrder.getItems()).toHaveLength(1);
        expect(persistedOrder.getItems()[0].getUnitPrice()).toBe(100);
        expect(eventPublisher.publishCreatedOrder).toHaveBeenCalledWith(createdOrder);
        expect(eventPublisher.publishStockReserved).toHaveBeenCalledWith(reservedStock);
    });

    it('throws BadRequestException when the order has no items', async () => {
        await expect(
            useCase.execute({ clientId: 'client-1', items: [] }),
        ).rejects.toThrow(BadRequestException);
        expect(clientRepository.findById).not.toHaveBeenCalled();
        expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the client does not exist', async () => {
        clientRepository.findById.mockResolvedValue(null);

        await expect(
            useCase.execute({
                clientId: 'missing-id',
                items: [{ productId: 'product-1', quantity: 1 }],
            }),
        ).rejects.toThrow(NotFoundException);
        expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the client is inactive', async () => {
        clientRepository.findById.mockResolvedValue(
            new ClientEntity(
                'Client 1',
                'client1@example.com',
                StatusClient.INACTIVE,
                'client-1',
            ),
        );

        await expect(
            useCase.execute({
                clientId: 'client-1',
                items: [{ productId: 'product-1', quantity: 1 }],
            }),
        ).rejects.toThrow(BadRequestException);
        expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when a product does not exist', async () => {
        clientRepository.findById.mockResolvedValue(
            new ClientEntity(
                'Client 1',
                'client1@example.com',
                StatusClient.ACTIVE,
                'client-1',
            ),
        );
        productRepository.findById.mockResolvedValue(null);

        await expect(
            useCase.execute({
                clientId: 'client-1',
                items: [{ productId: 'missing-product', quantity: 1 }],
            }),
        ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when a product is inactive', async () => {
        clientRepository.findById.mockResolvedValue(
            new ClientEntity(
                'Client 1',
                'client1@example.com',
                StatusClient.ACTIVE,
                'client-1',
            ),
        );
        productRepository.findById.mockResolvedValue(
            new ProductEntity(
                'sku-1',
                'Product 1',
                100,
                StatusProduct.INACTIVE,
                'product-1',
            ),
        );

        await expect(
            useCase.execute({
                clientId: 'client-1',
                items: [{ productId: 'product-1', quantity: 1 }],
            }),
        ).rejects.toThrow(BadRequestException);
        expect(stockRepository.reserve).not.toHaveBeenCalled();
    });

    it('still returns the created order when publishing events fails', async () => {
        clientRepository.findById.mockResolvedValue(
            new ClientEntity(
                'Client 1',
                'client1@example.com',
                StatusClient.ACTIVE,
                'client-1',
            ),
        );
        productRepository.findById.mockResolvedValue(
            new ProductEntity('sku-1', 'Product 1', 100, StatusProduct.ACTIVE, 'product-1'),
        );
        const reservedStock = new StockEntity('product-1', 8, 2);
        const createdOrder = new OrderEntity(
            'client-1',
            'order-1',
            [new OrderItemEntity('product-1', 2, 100)],
            StatusOrder.PENDING,
            200,
        );
        stockRepository.reserve.mockResolvedValue(reservedStock);
        orderRepository.create.mockResolvedValue(createdOrder);
        eventPublisher.publishCreatedOrder.mockRejectedValue(new Error('broker down'));
        eventPublisher.publishStockReserved.mockRejectedValue(new Error('broker down'));

        const result = await useCase.execute({
            clientId: 'client-1',
            items: [{ productId: 'product-1', quantity: 2 }],
        });

        expect(result).toBe(createdOrder);
    });
});
