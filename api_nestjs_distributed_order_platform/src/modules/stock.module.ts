import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { GetStockUseCase } from "src/application/use-case/stock/get-stock.use-case";
import { ReleaseStockUseCase } from "src/application/use-case/stock/release-stock.use-case";
import { ReserveStockUseCase } from "src/application/use-case/stock/reserve-stock.use-case";
import { UpdateStockUseCase } from "src/application/use-case/stock/update-stock.use-case";
import { StockModel } from "src/infrastructure/persistence/postgres/models/stock.model";
import { StockRepository } from "src/infrastructure/persistence/postgres/stock-repository";
import { SequelizeUnitOfWork } from "src/infrastructure/persistence/postgres/unit-of-work.repository";
import { StockController } from "src/presentation/http/stock.controller";
import { UNIT_OF_WORK_REPOSITORY } from "src/shared/tokens_nest/payment.token";
import { STOCK_REPOSITORY } from "src/shared/tokens_nest/stock.token";
import { RabbitMQModule } from "./rabbit-mq.module";


@Module({
    imports: [
        SequelizeModule.forFeature([
            StockModel,
        ]),
        RabbitMQModule,
    ],
    controllers: [StockController],
    providers: [
        StockRepository,
        {
            provide: STOCK_REPOSITORY,
            useClass: StockRepository,
        },
        ReserveStockUseCase,
        GetStockUseCase,
        ReleaseStockUseCase,
        UpdateStockUseCase
    ],
    exports: [
        STOCK_REPOSITORY,
        ReserveStockUseCase,
        GetStockUseCase,
        ReleaseStockUseCase,
        UpdateStockUseCase
    ],
})
export class StockModule {}