import { GetOrderUseCase } from "@/application/use-case/order/get-order.use-case";
import { NotFoundException } from "@nestjs/common";
import { OrderRepositoryInterface } from "src/application/port/order.repository";
import { OrderItemEntity } from "src/domain/entities/order-item.entity";
import { OrderEntity } from "src/domain/entities/order.entity";
import { StatusOrder } from "src/shared/enums/status-order.enum";

describe('GetOrderUseCase', () => {
    let orderRepository: jest.Mocked<OrderRepositoryInterface>;
    let useCase: GetOrderUseCase;

    beforeEach(() => {
        orderRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        useCase = new GetOrderUseCase(orderRepository);
    });

    it('returns the order from the repository', async () => {
        const order = new OrderEntity(
            'client-1',
            'order-1',
            [new OrderItemEntity('product-1', 2, 50)],
            StatusOrder.PENDING,
            100,
        );
        orderRepository.findById.mockResolvedValue(order);

        const result = await useCase.execute('order-1');

        expect(result).toBe(order);
        expect(orderRepository.findById).toHaveBeenCalledWith('order-1');
    });

    it('throws NotFoundException when the order does not exist', async () => {
        orderRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute('missing-id')).rejects.toThrow(NotFoundException);
    });
});
