import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PaymentCreateDto { 
    @ApiProperty({ example: '123', description: 'ID do pedido' })
    order_id!: string;

    @ApiPropertyOptional({ example: 100, description: 'Valor do pagamento' })
    amount?: number;
}
