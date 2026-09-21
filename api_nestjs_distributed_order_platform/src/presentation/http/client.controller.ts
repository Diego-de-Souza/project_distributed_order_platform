import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { CreateClientUseCase } from "src/application/use-case/client/create-client.use-case";
import { GetClientUseCase } from "src/application/use-case/client/get-client.use-case";
import { ListClientsUseCase } from "src/application/use-case/client/list-clients.use-case";
import { DeleteClientUseCase } from "src/application/use-case/client/delete-client.use-case";
import { toClientResponse } from "./mappers/client.mapper";
import { CreateClientDto } from "./dto/client.dto";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('Clients')
@Controller('clients')
export class ClientController {
    constructor(
        private readonly createClientUseCase: CreateClientUseCase,
        private readonly getClientUseCase: GetClientUseCase,
        private readonly listClientsUseCase: ListClientsUseCase,
        private readonly deleteClientUseCase: DeleteClientUseCase,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Cria um novo cliente' })
    @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
    @ApiResponse({ status: 400, description: 'Erro ao criar cliente' })
    async create(@Body() body: CreateClientDto) {
        const client = await this.createClientUseCase.execute(body);
        return toClientResponse(client);
    }

    @Get()
    @ApiOperation({ summary: 'Lista todos os clientes' })
    @ApiResponse({ status: 200, description: 'Lista de clientes obtida com sucesso' })
    async list() {
        const clients = await this.listClientsUseCase.execute();
        return clients.map(toClientResponse);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtém um cliente por ID' })
    @ApiResponse({ status: 200, description: 'Cliente obtido com sucesso' })
    @ApiResponse({ status: 400, description: 'Erro ao obter cliente' })
    async getById(@Param('id') id: string) {
        const client = await this.getClientUseCase.execute(id);
        return toClientResponse(client);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remove um cliente por ID' })
    @ApiResponse({ status: 200, description: 'Cliente removido com sucesso' })
    @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
    async delete(@Param('id') id: string) {
        await this.deleteClientUseCase.execute(id);
        return { message: 'Client deleted successfully' };
    }
}
