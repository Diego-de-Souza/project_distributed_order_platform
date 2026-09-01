import { ListOrdersUseCase } from "@/application/use-case/order/list-orders.use-case";
import { OrderRepositoryInterface } from "src/application/port/order.repository";
import { OrderEntity } from "src/domain/entities/order.entity";
import { StatusOrder } from "src/shared/enums/status-order.enum";

describe('ListOrdersUseCase', () => {
    let orderRepository: jest.Mocked<OrderRepositoryInterface>;
    let useCase: ListOrdersUseCase;

    beforeEach(() => {
        orderRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        useCase = new ListOrdersUseCase(orderRepository);
    });

    it('returns all orders from the repository', async () => {
        const orders = [
            new OrderEntity('client-1', 'order-1', [], StatusOrder.PENDING, 0),
            new OrderEntity('client-2', 'order-2', [], StatusOrder.CONFIRMED, 0),
        ];
        orderRepository.findAll.mockResolvedValue(orders);

        const result = await useCase.execute();

        expect(result).toBe(orders);
        expect(orderRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('returns an empty list when there are no orders', async () => {
        orderRepository.findAll.mockResolvedValue([]);

        const result = await useCase.execute();

        expect(result).toEqual([]);
    });
});
