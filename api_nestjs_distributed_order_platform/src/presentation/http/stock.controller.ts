import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { GetStockUseCase } from "src/application/use-case/stock/get-stock.use-case";
import { ReleaseStockUseCase } from "src/application/use-case/stock/release-stock.use-case";
import { ReserveStockUseCase } from "src/application/use-case/stock/reserve-stock.use-case";
import { UpdateStockUseCase } from "src/application/use-case/stock/update-stock.use-case";
import { toStockResponse } from "./mappers/stock.mapper";
import { UpdateStockDto } from "./dto/stock.dto";
import { StockQuantityDto } from "./dto/stock.dto";

@Controller('stock')
export class StockController {
    constructor(
        private readonly getStockUseCase: GetStockUseCase,
        private readonly updateStockUseCase: UpdateStockUseCase,
        private readonly reserveStockUseCase: ReserveStockUseCase,
        private readonly releaseStockUseCase: ReleaseStockUseCase,
    ) {}

    @Get(':productId')
    async getByProductId(@Param('productId') productId: string) {
        const stock = await this.getStockUseCase.execute(productId);
        return toStockResponse(stock);
    }

    @Put(':productId')
    async update(
        @Param('productId') productId: string,
        @Body() body: UpdateStockDto,
    ) {
        const stock = await this.updateStockUseCase.execute({
            productId,
            availableQuantity: body.availableQuantity,
            reservedQuantity: body.reservedQuantity,
        });
        return toStockResponse(stock);
    }

    @Post(':productId/reserve')
    async reserve(
        @Param('productId') productId: string,
        @Body() body: StockQuantityDto,
    ) {
        const stock = await this.reserveStockUseCase.execute(
            productId,
            body.quantity,
        );
        return toStockResponse(stock);
    }

    @Post(':productId/release')
    async release(
        @Param('productId') productId: string,
        @Body() body: StockQuantityDto,
    ) {
        const stock = await this.releaseStockUseCase.execute(
            productId,
            body.quantity,
        );
        return toStockResponse(stock);
    }
}
