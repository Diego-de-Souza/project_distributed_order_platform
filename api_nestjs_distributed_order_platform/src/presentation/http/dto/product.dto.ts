import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { StatusProduct } from "src/shared/enums/status-product.enum";

export class CreateProductDto {
    @ApiProperty({ example: 'SKU-001', description: 'SKU único do produto' })
    sku!: string;

    @ApiProperty({ example: 'Mouse sem fio' })
    name!: string;

    @ApiProperty({ example: 49.9, description: 'Preço em reais' })
    price!: number;

    @ApiPropertyOptional({ enum: StatusProduct, default: StatusProduct.ACTIVE })
    status?: StatusProduct;

    @ApiPropertyOptional({ example: 100, description: 'Quantidade inicial em estoque' })
    initialStock?: number;
}