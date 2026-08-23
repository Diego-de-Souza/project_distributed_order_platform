import { ProductEntity } from "src/domain/entities/product.entity";

export function toProductResponse(product: ProductEntity) {
    return {
        id: product.getId(),
        sku: product.getSku(),
        name: product.getName(),
        price: product.getPrice(),
        status: product.getStatus(),
    };
}
