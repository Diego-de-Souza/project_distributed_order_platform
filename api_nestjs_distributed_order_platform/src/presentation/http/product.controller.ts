import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateProductUseCase } from "src/application/use-case/product/create-product.use-case";
import { GetProductUseCase } from "src/application/use-case/product/get-product.use-case";
import { toProductResponse } from "./mappers/product.mapper";
import { CreateProductDto } from "./dto/product.dto";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('Products')
@Controller('products')
export class ProductController {
    constructor(
        private readonly createProductUseCase: CreateProductUseCase,
        private readonly getProductUseCase: GetProductUseCase,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Cria um novo produto' })
    @ApiResponse({ status: 201, description: 'Produto criado com sucesso' })
    @ApiResponse({ status: 400, description: 'Erro ao criar produto' })
    async create(@Body() body: CreateProductDto) {
        const product = await this.createProductUseCase.execute(body);
        return toProductResponse(product);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtém um produto por ID' })
    @ApiResponse({ status: 200, description: 'Produto obtido com sucesso' })
    @ApiResponse({ status: 400, description: 'Erro ao obter produto' })
    async getById(@Param('id') id: string) {
        const product = await this.getProductUseCase.execute(id);
        return toProductResponse(product);
    }
}
