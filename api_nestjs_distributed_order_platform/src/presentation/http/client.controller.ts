import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateClientUseCase } from "src/application/use-case/client/create-client.use-case";
import { GetClientUseCase } from "src/application/use-case/client/get-client.use-case";
import { toClientResponse } from "./mappers/client.mapper";
import { CreateClientDto } from "./dto/client.dto";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('Clients')
@Controller('clients')
export class ClientController {
    constructor(
        private readonly createClientUseCase: CreateClientUseCase,
        private readonly getClientUseCase: GetClientUseCase,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Cria um novo cliente' })
    @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
    @ApiResponse({ status: 400, description: 'Erro ao criar cliente' })
    async create(@Body() body: CreateClientDto) {
        const client = await this.createClientUseCase.execute(body);
        return toClientResponse(client);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtém um cliente por ID' })
    @ApiResponse({ status: 200, description: 'Cliente obtido com sucesso' })
    @ApiResponse({ status: 400, description: 'Erro ao obter cliente' })
    async getById(@Param('id') id: string) {
        const client = await this.getClientUseCase.execute(id);
        return toClientResponse(client);
    }
}
