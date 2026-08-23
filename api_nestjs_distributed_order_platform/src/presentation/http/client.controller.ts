import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateClientUseCase } from "src/application/use-case/client/create-client.use-case";
import { GetClientUseCase } from "src/application/use-case/client/get-client.use-case";
import { toClientResponse } from "./mappers/client.mapper";
import { CreateClientDto } from "./dto/client.dto";

@Controller('clients')
export class ClientController {
    constructor(
        private readonly createClientUseCase: CreateClientUseCase,
        private readonly getClientUseCase: GetClientUseCase,
    ) {}

    @Post()
    async create(@Body() body: CreateClientDto) {
        const client = await this.createClientUseCase.execute(body);
        return toClientResponse(client);
    }

    @Get(':id')
    async getById(@Param('id') id: string) {
        const client = await this.getClientUseCase.execute(id);
        return toClientResponse(client);
    }
}
