export interface StockAttributes {
    product_id: string;
    available_quantity: number;
    reserved_quantity: number;
    version: number;
}

export interface UpdateStockInput {
    productId: string;
    availableQuantity: number;
    reservedQuantity?: number;
}