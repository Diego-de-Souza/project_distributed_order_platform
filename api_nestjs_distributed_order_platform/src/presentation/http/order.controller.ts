import { Body, Controller, Get, Param, Post, UseInterceptors } from "@nestjs/common";
import { CancelOrderUseCase } from "src/application/use-case/order/cancel-order.use-case";
import { ConfirmOrderUseCase } from "src/application/use-case/order/confirm-order.use-case";
import { CreateOrderUseCase } from "src/application/use-case/order/create-order.use-case";
import { GetOrderUseCase } from "src/application/use-case/order/get-order.use-case";
import { ListOrdersUseCase } from "src/application/use-case/order/list-orders.use-case";
import { toOrderResponse } from "./mappers/order.mapper";
import { CreateOrderDto } from "./dto/order.dto";
import { IdempotencyBodyInterceptor } from "./interceptor/idempotency-body.interceptor";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('Orders')
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
    @UseInterceptors(IdempotencyBodyInterceptor)
    @ApiOperation({ summary: 'Cria um novo pedido' })
    @ApiResponse({ status: 201, description: 'Pedido criado com sucesso' })
    @ApiResponse({ status: 400, description: 'Erro ao criar pedido' })
    async create(@Body() body: CreateOrderDto) {
        const order = await this.createOrderUseCase.execute(body);
        return toOrderResponse(order);
    }

    @Get()
    @ApiOperation({ summary: 'Lista todos os pedidos' })
    @ApiResponse({ status: 200, description: 'Pedidos listados com sucesso' })
    @ApiResponse({ status: 400, description: 'Erro ao listar pedidos' })
    async list() {
        const orders = await this.listOrdersUseCase.execute();
        return orders.map(toOrderResponse);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtém um pedido por ID' })
    @ApiResponse({ status: 200, description: 'Pedido obtido com sucesso' })
    @ApiResponse({ status: 400, description: 'Erro ao obter pedido' })
    async getById(@Param('id') id: string) {
        const order = await this.getOrderUseCase.execute(id);
        return toOrderResponse(order);
    }

    @Post(':id/confirm')
    @ApiOperation({ summary: 'Confirma um pedido por ID' })
    @ApiResponse({ status: 200, description: 'Pedido confirmado com sucesso' })
    @ApiResponse({ status: 400, description: 'Erro ao confirmar pedido' })
    async confirm(@Param('id') id: string) {
        const order = await this.confirmOrderUseCase.execute(id);
        return toOrderResponse(order);
    }

    @Post(':id/cancel')
    @ApiOperation({ summary: 'Cancela um pedido por ID' })
    @ApiResponse({ status: 200, description: 'Pedido cancelado com sucesso' })
    @ApiResponse({ status: 400, description: 'Erro ao cancelar pedido' })
    async cancel(@Param('id') id: string) {
        const order = await this.cancelOrderUseCase.execute(id);
        return toOrderResponse(order);
    }
}
