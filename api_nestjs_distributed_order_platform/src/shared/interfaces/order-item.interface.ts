export interface OrderItemAttributes {
    id?: string;
    order_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    sub_total: number;
}
