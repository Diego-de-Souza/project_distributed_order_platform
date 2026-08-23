import { StatusProduct } from "../enums/status-product.enum";

export interface ProductAttributes {
    id?: string;
    sku: string;
    name: string;
    price: number;
    status: StatusProduct;
}


export interface CreateProductInput {
    sku: string;
    name: string;
    price: number;
    status?: StatusProduct;
    initialStock?: number;
}