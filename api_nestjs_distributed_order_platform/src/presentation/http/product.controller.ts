import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateProductUseCase } from "src/application/use-case/product/create-product.use-case";
import { GetProductUseCase } from "src/application/use-case/product/get-product.use-case";
import { toProductResponse } from "./mappers/product.mapper";
import { CreateProductDto } from "./dto/product.dto";

@Controller('products')
export class ProductController {
    constructor(
        private readonly createProductUseCase: CreateProductUseCase,
        private readonly getProductUseCase: GetProductUseCase,
    ) {}

    @Post()
    async create(@Body() body: CreateProductDto) {
        const product = await this.createProductUseCase.execute(body);
        return toProductResponse(product);
    }

    @Get(':id')
    async getById(@Param('id') id: string) {
        const product = await this.getProductUseCase.execute(id);
        return toProductResponse(product);
    }
}
