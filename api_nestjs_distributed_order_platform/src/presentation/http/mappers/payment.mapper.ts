import { PaymentEntity } from "src/domain/entities/payment.entity";

export function toPaymentResponse(payment: PaymentEntity) {
    return {
        id: payment.getId(),
        orderId: payment.getOrderId(),
        amount: payment.getAmount(),
        status: payment.getStatus(),
        attempts: payment.getAttempts(),
        externalId: payment.getExternalId(),
        lastErrorCode: payment.getLastErrorCode(),
        lastErrorMessage: payment.getLastErrorMessage(),
    };
}
