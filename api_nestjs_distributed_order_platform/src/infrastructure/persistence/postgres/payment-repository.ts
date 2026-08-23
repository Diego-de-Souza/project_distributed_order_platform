import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Transaction } from "sequelize";
import type { PaymentRepositoryInterface } from "src/application/port/payment.repository";
import { PaymentEntity } from "src/domain/entities/payment.entity";
import { PaymentModel } from "./models/payment.model";

@Injectable()
export class PaymentRepository implements PaymentRepositoryInterface {
    constructor(
        @InjectModel(PaymentModel)
        private readonly paymentModel: typeof PaymentModel,
    ) {}

    async createPayment(payment: PaymentEntity): Promise<PaymentEntity> {
        const created = await this.paymentModel.create({
            order_id: payment.getOrderId(),
            amount: payment.getAmount(),
            status: payment.getStatus(),
            attempts: payment.getAttempts(),
            created_at: new Date(),
            updated_at: new Date(),
        });

        return new PaymentEntity(
            created.order_id,
            Number(created.amount),
            created.status,
            created.id,
        );
    }

    async getPaymentById(id: string): Promise<PaymentEntity | null> {
        const payment = await this.paymentModel.findByPk(id);
        return payment ? this.toEntity(payment) : null;
    }

    async updatePayment(
        payment: PaymentEntity,
        transaction?: Transaction,
    ): Promise<void> {
        await this.paymentModel.update(
            {
                status: payment.getStatus(),
                attempts: payment.getAttempts(),
                last_error_code: payment.getLastErrorCode() ?? undefined,
                last_error_message: payment.getLastErrorMessage() ?? undefined,
                gateway_raw_response: payment.getGatewayRawResponse() ?? undefined,
                updated_at: new Date(),
            },
            {
                where: { id: payment.getId() },
                transaction,
            },
        );
    }

    async deletePayment(id: string): Promise<void> {
        await this.paymentModel.destroy({ where: { id } });
    }

    private toEntity(payment: PaymentModel): PaymentEntity {
        return new PaymentEntity(
            payment.order_id,
            Number(payment.amount),
            payment.status,
            payment.id,
        );
    }
}
