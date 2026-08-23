import { Injectable } from "@nestjs/common";
import type { PaymentGatewayInterface } from "src/application/port/payment-gateway.repository";
import type { GatewayResult } from "src/shared/interfaces/gateway.interface";
import { randomUUID } from "crypto";

@Injectable()
export class StubPaymentGateway implements PaymentGatewayInterface {
    private readonly charges = new Map<string, GatewayResult>();

    async createCharge(input: {
        paymentId: string;
        orderId: string;
        amount: number;
        idempotencyKey: string;
    }): Promise<GatewayResult> {
        const existing = this.charges.get(input.idempotencyKey);
        if (existing) {
            return existing;
        }

        const cents = Math.round((input.amount % 1) * 100);

        if (cents === 13) {
            throw new Error('ETIMEDOUT: gateway connection timeout');
        }

        if (cents === 99) {
            const failed: GatewayResult = {
                success: false,
                kind: 'BUSINESS',
                status: 'failed',
                errorCode: 'card_declined',
                errorMessage: 'Card was declined',
                raw: { reason: 'card_declined' },
            };
            this.charges.set(input.idempotencyKey, failed);
            return failed;
        }

        const paid: GatewayResult = {
            success: true,
            status: 'paid',
            externalId: `stub_${randomUUID()}`,
            raw: {
                paymentId: input.paymentId,
                orderId: input.orderId,
                amount: input.amount,
            },
        };
        this.charges.set(input.idempotencyKey, paid);
        return paid;
    }

    async retrieveCharge(input: {
        idempotencyKey: string;
        externalId?: string;
    }): Promise<GatewayResult> {
        const existing = this.charges.get(input.idempotencyKey);
        if (existing) {
            return existing;
        }

        return {
            success: false,
            kind: 'RETRIABLE',
            status: 'pending',
            errorCode: 'CHARGE_NOT_FOUND',
            errorMessage: 'Charge not found yet',
        };
    }
}
