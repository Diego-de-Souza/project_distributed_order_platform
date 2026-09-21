import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";

export class UpdateStockDto {
    @ApiProperty({ example: 100, description: 'Quantidade disponível' })
    @IsInt({ message: 'A quantidade disponível deve ser um número inteiro' })
    @Min(0, { message: 'A quantidade disponível deve ser maior que 0' })
    availableQuantity!: number;

    @ApiPropertyOptional({ example: 10, description: 'Quantidade reservada' })
    @IsInt({ message: 'A quantidade reservada deve ser um número inteiro' })
    @Min(0, { message: 'A quantidade reservada deve ser maior que 0' })
    reservedQuantity?: number;
}

export class StockQuantityDto {
    @ApiProperty({ example: 100, description: 'Quantidade disponível' })
    @IsInt({ message: 'A quantidade deve ser um número inteiro' })
    @Min(0, { message: 'A quantidade deve ser maior que 0' })
    quantity!: number;
}