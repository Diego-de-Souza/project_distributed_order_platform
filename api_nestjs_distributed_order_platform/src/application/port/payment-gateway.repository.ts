import { GatewayResult } from "src/shared/interfaces/gateway.interface";


export interface PaymentGatewayInterface {
    createCharge(input: {
      paymentId: string;
      orderId: string;
      amount: number;
      idempotencyKey: string;
    }): Promise<GatewayResult>;
    retrieveCharge(input: {
      idempotencyKey: string;
      externalId?: string;
    }): Promise<GatewayResult>;
}
