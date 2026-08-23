import { StatusOrder } from "../enums/status-order.enum";

export interface OrderAttributes {
    id?: string;
    client_id: string;
    total: number;
    status: StatusOrder;
    created_at?: Date;
    updated_at?: Date;
    version?: number;
}

export interface CreateOrderItemInput {
    productId: string;
    quantity: number;
}

export interface CreateOrderInput {
    clientId: string;
    items: CreateOrderItemInput[];
}
