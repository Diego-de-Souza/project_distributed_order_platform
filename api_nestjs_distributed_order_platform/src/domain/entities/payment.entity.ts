import { StatusPayment } from "src/shared/enums/status-payment.enum";

export class PaymentEntity {
    private status: StatusPayment;
    private attempts: number = 0;
    private lastErrorMessage: string | null = null;
    private lastErrorCode: string | null = null;
    private gatewayRawResponse: unknown | null = null;
    private externalId: string | null = null;

    constructor(
        private readonly orderId: string,
        private readonly amount: number,
        status?: StatusPayment,
        private readonly id?: string,
    ) {
        if (!orderId) {
            throw new Error('Order ID is required');
        }
        if (amount <= 0) {
            throw new Error('Amount must be greater than zero');
        }

        this.status = status ?? StatusPayment.PENDING;
    }

    getId(): string {
        return this.id ?? '';
    }

    getOrderId(): string {
        return this.orderId;
    }

    getAmount(): number {
        return this.amount;
    }

    getStatus(): StatusPayment {
        return this.status;
    }

    getAttempts(): number {
        return this.attempts;
    }

    incrementAttempts(): void {
        this.attempts += 1;
    }

    getLastErrorMessage(): string | null {
        return this.lastErrorMessage;
    }

    getLastErrorCode(): string | null {
        return this.lastErrorCode;
    }

    getGatewayRawResponse(): unknown | null {
        return this.gatewayRawResponse;
    }

    getExternalId(): string | null {
        return this.externalId;
    }

    markAsPaid(externalId: string, raw: unknown): void {
        if (this.status !== StatusPayment.PENDING) {
            throw new Error('Payment is not pending');
        }
        this.status = StatusPayment.PAID;
        this.externalId = externalId;
        this.gatewayRawResponse = raw;
        this.lastErrorCode = null;
        this.lastErrorMessage = null;
    }

    markAsFailed(errorCode: string, errorMessage: string, raw?: unknown): void {
        this.status = StatusPayment.FAILED;
        this.lastErrorCode = errorCode;
        this.lastErrorMessage = errorMessage;
        if (raw !== undefined) {
            this.gatewayRawResponse = raw;
        }
    }

    withId(id: string): PaymentEntity {
        const payment = new PaymentEntity(
            this.orderId,
            this.amount,
            this.status,
            id,
        );
        payment.attempts = this.attempts;
        payment.lastErrorCode = this.lastErrorCode;
        payment.lastErrorMessage = this.lastErrorMessage;
        payment.gatewayRawResponse = this.gatewayRawResponse;
        payment.externalId = this.externalId;
        return payment;
    }
}
