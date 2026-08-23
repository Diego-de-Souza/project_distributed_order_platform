import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CancelOrderUseCase } from "src/application/use-case/order/cancel-order.use-case";
import { ConfirmOrderUseCase } from "src/application/use-case/order/confirm-order.use-case";
import { CreateOrderUseCase } from "src/application/use-case/order/create-order.use-case";
import { GetOrderUseCase } from "src/application/use-case/order/get-order.use-case";
import { ListOrdersUseCase } from "src/application/use-case/order/list-orders.use-case";
import { toOrderResponse } from "./mappers/order.mapper";
import { CreateOrderDto } from "./dto/order.dto";

@Controller('orders')
export class OrderController {
    constructor(
        private readonly createOrderUseCase: CreateOrderUseCase,
        private readonly getOrderUseCase: GetOrderUseCase,
        private readonly listOrdersUseCase: ListOrdersUseCase,
        private readonly confirmOrderUseCase: ConfirmOrderUseCase,
        private readonly cancelOrderUseCase: CancelOrderUseCase,
    ) {}

    @Post()
    async create(@Body() body: CreateOrderDto) {
        const order = await this.createOrderUseCase.execute(body);
        return toOrderResponse(order);
    }

    @Get()
    async list() {
        const orders = await this.listOrdersUseCase.execute();
        return orders.map(toOrderResponse);
    }

    @Get(':id')
    async getById(@Param('id') id: string) {
        const order = await this.getOrderUseCase.execute(id);
        return toOrderResponse(order);
    }

    @Post(':id/confirm')
    async confirm(@Param('id') id: string) {
        const order = await this.confirmOrderUseCase.execute(id);
        return toOrderResponse(order);
    }

    @Post(':id/cancel')
    async cancel(@Param('id') id: string) {
        const order = await this.cancelOrderUseCase.execute(id);
        return toOrderResponse(order);
    }
}
