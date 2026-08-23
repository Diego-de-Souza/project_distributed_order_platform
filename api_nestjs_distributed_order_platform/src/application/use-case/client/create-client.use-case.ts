import { Inject, Injectable } from "@nestjs/common";
import type { ClientRepositoryInterface } from "src/application/port/client.repository";
import { ClientEntity } from "src/domain/entities/client.entity";
import { CreateClientInput } from "src/shared/interfaces/client.interface";
import { CLIENT_REPOSITORY } from "src/shared/tokens_nest/client.token";

@Injectable()
export class CreateClientUseCase {
    constructor(
        @Inject(CLIENT_REPOSITORY)
        private readonly clientRepository: ClientRepositoryInterface,
    ) {}

    async execute(input: CreateClientInput): Promise<ClientEntity> {
        const client = new ClientEntity(input.name, input.email, input.status);
        return this.clientRepository.create(client);
    }
}
