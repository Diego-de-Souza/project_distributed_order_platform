import { ConflictException, Inject, Injectable } from "@nestjs/common";
import type { ProductRepositoryInterface } from "src/application/port/product.repository";
import type { StockRepositoryInterface } from "src/application/port/stock.repository";
import { ProductEntity } from "src/domain/entities/product.entity";
import { StockEntity } from "src/domain/entities/stock.entity";
import { CreateProductInput } from "src/shared/interfaces/product.interface";
import { PRODUCT_REPOSITORY } from "src/shared/tokens_nest/product.token";
import { STOCK_REPOSITORY } from "src/shared/tokens_nest/stock.token";

@Injectable()
export class CreateProductUseCase {
    constructor(
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: ProductRepositoryInterface,
        @Inject(STOCK_REPOSITORY)
        private readonly stockRepository: StockRepositoryInterface,
    ) {}

    async execute(input: CreateProductInput): Promise<ProductEntity> {
        const existing = await this.productRepository.findBySku(input.sku);
        if (existing) {
            throw new ConflictException('Product with this SKU already exists');
        }

        const product = new ProductEntity(
            input.sku,
            input.name,
            input.price,
            input.status,
        );

        const created = await this.productRepository.create(product);

        await this.stockRepository.create(
            new StockEntity(created.getId(), input.initialStock ?? 0, 0),
        );

        return created;
    }
}
