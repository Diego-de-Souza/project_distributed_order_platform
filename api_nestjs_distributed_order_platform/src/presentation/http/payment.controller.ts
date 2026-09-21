import { Body, Controller, Post, UseInterceptors } from "@nestjs/common";
import { CreatePaymentUseCase } from "src/application/use-case/payment/create-payment.use-case";
import { PaymentCreateDto } from "./dto/payment.dto";
import { toPaymentResponse } from "./mappers/payment.mapper";
import { IdempotencyBodyInterceptor } from "./interceptor/idempotency-body.interceptor";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
    constructor(
        private readonly createPaymentUseCase: CreatePaymentUseCase,
    ) {}

    @Post()
    @UseInterceptors(IdempotencyBodyInterceptor)
    @ApiOperation({ summary: 'Cria um novo pagamento' })
    @ApiResponse({ status: 201, description: 'Pagamento criado com sucesso' })
    @ApiResponse({ status: 400, description: 'Erro ao criar pagamento' })
    async createPayment(@Body() body: PaymentCreateDto) {
        const payment = await this.createPaymentUseCase.execute(body);
        return toPaymentResponse(payment);
    }
}
