import { StatusPayment } from "../enums/status-payment.enum";

export interface PaymentCreateAttributes {
    id?: string;
    order_id: string;
    amount?: number;
    status?: StatusPayment;
    attempts?: number;
    last_error_message?: string;
    last_error_code?: string;
    gateway_raw_response?: any;
    created_at?: Date;
    updated_at?: Date;
}