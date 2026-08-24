import { Body, Controller, Post, UseInterceptors } from "@nestjs/common";
import { CreatePaymentUseCase } from "src/application/use-case/payment/create-payment.use-case";
import { PaymentCreateDto } from "./dto/payment.dto";
import { toPaymentResponse } from "./mappers/payment.mapper";
import { IdempotencyBodyInterceptor } from "./interceptor/idempotency-body.interceptor";

@Controller('payments')
export class PaymentController {
    constructor(
        private readonly createPaymentUseCase: CreatePaymentUseCase,
    ) {}

    @Post()
    @UseInterceptors(IdempotencyBodyInterceptor)
    async createPayment(@Body() body: PaymentCreateDto) {
        const payment = await this.createPaymentUseCase.execute(body);
        return toPaymentResponse(payment);
    }
}
