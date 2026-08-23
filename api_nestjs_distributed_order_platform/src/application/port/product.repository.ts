import { ProductEntity } from "src/domain/entities/product.entity";

export interface ProductRepositoryInterface {
    create(product: ProductEntity): Promise<ProductEntity>;
    findById(productId: string): Promise<ProductEntity | null>;
    findAll(): Promise<ProductEntity[]>;
    update(product: ProductEntity): Promise<void>;
    delete(productId: string): Promise<void>;
    findBySku(sku: string): Promise<ProductEntity | null>;
}
