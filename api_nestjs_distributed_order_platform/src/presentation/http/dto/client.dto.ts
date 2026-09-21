import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { StatusClient } from "src/shared/enums/status-client.enum";

export class CreateClientDto {
    @ApiProperty({ example: 'John Doe', description: 'Nome do cliente' })
    name!: string;

    @ApiProperty({ example: 'john.doe@example.com', description: 'Email do cliente' })
    email!: string;

    @ApiPropertyOptional({ enum: StatusClient, default: StatusClient.ACTIVE })
    status?: StatusClient;
}