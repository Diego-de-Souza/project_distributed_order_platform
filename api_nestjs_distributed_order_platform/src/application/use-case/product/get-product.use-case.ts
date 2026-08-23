import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { ProductRepositoryInterface } from "src/application/port/product.repository";
import { ProductEntity } from "src/domain/entities/product.entity";
import { PRODUCT_REPOSITORY } from "src/shared/tokens_nest/product.token";

@Injectable()
export class GetProductUseCase {
    constructor(
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: ProductRepositoryInterface,
    ) {}

    async execute(productId: string): Promise<ProductEntity> {
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        return product;
    }
}
