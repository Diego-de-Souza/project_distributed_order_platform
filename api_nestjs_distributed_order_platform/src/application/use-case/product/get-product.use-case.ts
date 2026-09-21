import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { ProductRepositoryInterface } from "src/application/port/product.repository";
import type { CacheStoreInterface } from "src/application/port/redis-store.repository";
import { ProductEntity } from "src/domain/entities/product.entity";
import { PRODUCT_REPOSITORY } from "src/shared/tokens_nest/product.token";
import { CACHE_STORE } from "src/shared/tokens_nest/redis.token";

const PRODUCT_CACHE_TTL_SECONDS = 300;
@Injectable()
export class GetProductUseCase {
    constructor(
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: ProductRepositoryInterface,
        @Inject(CACHE_STORE)
        private readonly cacheStore: CacheStoreInterface,
    ) {}

    async execute(productId: string): Promise<ProductEntity> {
        const cacheKey = `product:${productId}`;

        const cached = await this.cacheStore.get<{
            sku: string;
            name: string;
            price: number;
            status: ProductEntity['getStatus'] extends () => infer S ? S : never;
            id: string;
        }>(cacheKey);

        if (cached) {
            return new ProductEntity(cached.sku, cached.name, cached.price, cached.status, cached.id);
        }

        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        await this.cacheStore.set(cacheKey, {
            sku: product.getSku(),
            name: product.getName(),
            price: product.getPrice(),
            status: product.getStatus(),
            id: product.getId(),
        }, PRODUCT_CACHE_TTL_SECONDS);

        return product;
    }
}
