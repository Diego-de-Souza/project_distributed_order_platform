import { StatusProduct } from "src/shared/enums/status-product.enum";

export class CreateProductDto {
    sku!: string;
    name!: string;
    price!: number;
    status?: StatusProduct;
    initialStock?: number;
}