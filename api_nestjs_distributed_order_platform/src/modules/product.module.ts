import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { CreateProductUseCase } from "src/application/use-case/product/create-product.use-case";
import { GetProductUseCase } from "src/application/use-case/product/get-product.use-case";
import { GetStockUseCase } from "src/application/use-case/stock/get-stock.use-case";
import { ReleaseStockUseCase } from "src/application/use-case/stock/release-stock.use-case";
import { ReserveStockUseCase } from "src/application/use-case/stock/reserve-stock.use-case";
import { UpdateStockUseCase } from "src/application/use-case/stock/update-stock.use-case";
import { ProductModel } from "src/infrastructure/persistence/postgres/models/product.model";
import { StockModel } from "src/infrastructure/persistence/postgres/models/stock.model";
import { ProductRepository } from "src/infrastructure/persistence/postgres/product-repository";
import { StockRepository } from "src/infrastructure/persistence/postgres/stock-repository";
import { ProductController } from "src/presentation/http/product.controller";
import { StockController } from "src/presentation/http/stock.controller";
import { PRODUCT_REPOSITORY } from "src/shared/tokens_nest/product.token";
import { STOCK_REPOSITORY } from "src/shared/tokens_nest/stock.token";

@Module({
    imports: [SequelizeModule.forFeature([ProductModel, StockModel])],
    controllers: [ProductController, StockController],
    providers: [
        ProductRepository,
        StockRepository,
        {
            provide: PRODUCT_REPOSITORY,
            useClass: ProductRepository,
        },
        {
            provide: STOCK_REPOSITORY,
            useClass: StockRepository,
        },
        CreateProductUseCase,
        GetProductUseCase,
        GetStockUseCase,
        UpdateStockUseCase,
        ReserveStockUseCase,
        ReleaseStockUseCase,
    ],
    exports: [
        PRODUCT_REPOSITORY,
        STOCK_REPOSITORY,
        CreateProductUseCase,
        GetProductUseCase,
    ],
})
export class ProductModule {}
