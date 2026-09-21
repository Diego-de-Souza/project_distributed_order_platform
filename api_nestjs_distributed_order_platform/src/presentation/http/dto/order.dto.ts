import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsInt, Max, Min, ValidateNested } from "class-validator";

export class CreateOrderItemDto {
    @ApiProperty({ example: '123', description: 'ID do produto' })
    productId!: string;

    @ApiProperty({ example: 1, description: 'Quantidade do produto' })
    @IsInt({ message: 'A quantidade deve ser um número inteiro' })
    @Min(1, { message: 'A quantidade deve ser maior que 0' })
    @Max(100, { message: 'A quantidade deve ser menor que 100' })
    quantity!: number;
}

export class CreateOrderDto {
    @ApiProperty({ example: '123', description: 'ID do cliente' })
    clientId!: string;

    @ApiProperty({ example: [{ productId: '123', quantity: 1 }], description: 'Itens do pedido' })
    @IsArray({ message: 'Itens do pedido devem ser um array' })
    @ValidateNested({ each: true, message: 'Cada item do pedido deve ser um objeto válido' })
    @Type(() => CreateOrderItemDto)
    items!: CreateOrderItemDto[];
}