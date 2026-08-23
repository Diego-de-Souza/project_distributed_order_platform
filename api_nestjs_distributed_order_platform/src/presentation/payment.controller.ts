import { Body, Controller, Post } from "@nestjs/common";
import { CreatePaymentUseCase } from "src/application/use-case/payment/create-payment.use-case";
import { PaymentCreateDto } from "./http/dto/payment.dto";
import { toPaymentResponse } from "./http/mappers/payment.mapper";

@Controller('payments')
export class PaymentController {
    constructor(
        private readonly createPaymentUseCase: CreatePaymentUseCase,
    ) {}

    @Post()
    async createPayment(@Body() body: PaymentCreateDto) {
        const payment = await this.createPaymentUseCase.execute(body);
        return toPaymentResponse(payment);
    }
}
