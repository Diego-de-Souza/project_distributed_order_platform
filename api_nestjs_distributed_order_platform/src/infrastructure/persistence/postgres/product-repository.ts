import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import type { ProductRepositoryInterface } from "src/application/port/product.repository";
import { ProductEntity } from "src/domain/entities/product.entity";
import { ProductModel } from "./models/product.model";

@Injectable()
export class ProductRepository implements ProductRepositoryInterface {
    constructor(
        @InjectModel(ProductModel) private readonly productModel: typeof ProductModel,
    ) {}

    async create(product: ProductEntity): Promise<ProductEntity> {
        const created = await this.productModel.create({
            sku: product.getSku(),
            name: product.getName(),
            price: product.getPrice(),
            status: product.getStatus(),
        });

        return this.toEntity(created);
    }

    async findById(productId: string): Promise<ProductEntity | null> {
        const product = await this.productModel.findByPk(productId);
        return product ? this.toEntity(product) : null;
    }

    async findAll(): Promise<ProductEntity[]> {
        const products = await this.productModel.findAll();
        return products.map((product) => this.toEntity(product));
    }

    async update(product: ProductEntity): Promise<void> {
        await this.productModel.update(
            {
                name: product.getName(),
                sku: product.getSku(),
                price: product.getPrice(),
                status: product.getStatus(),
            },
            { where: { id: product.getId() } },
        );
    }

    async delete(productId: string): Promise<void> {
        await this.productModel.destroy({ where: { id: productId } });
    }

    async findBySku(sku: string): Promise<ProductEntity | null> {
        const product = await this.productModel.findOne({ where: { sku } });
        return product ? this.toEntity(product) : null;
    }

    private toEntity(product: ProductModel): ProductEntity {
        return new ProductEntity(
            product.sku,
            product.name,
            Number(product.price),
            product.status,
            product.id,
        );
    }
}
