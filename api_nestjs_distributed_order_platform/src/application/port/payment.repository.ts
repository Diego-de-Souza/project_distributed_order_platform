import { PaymentEntity } from "src/domain/entities/payment.entity";
import { StatusPayment } from "src/shared/enums/status-payment.enum";
import { Transaction } from "sequelize";

export interface PaymentRepositoryInterface {
    createPayment(payment: PaymentEntity): Promise<PaymentEntity>;
    getPaymentById(id: string): Promise<PaymentEntity | null>;
    updatePayment(payment: PaymentEntity, transaction?: Transaction): Promise<void>;
    deletePayment(id: string): Promise<void>;
}
