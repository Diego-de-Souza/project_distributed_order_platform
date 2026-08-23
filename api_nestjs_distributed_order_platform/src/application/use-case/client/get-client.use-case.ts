import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { ClientRepositoryInterface } from "src/application/port/client.repository";
import { ClientEntity } from "src/domain/entities/client.entity";
import { CLIENT_REPOSITORY } from "src/shared/tokens_nest/client.token";

@Injectable()
export class GetClientUseCase {
    constructor(
        @Inject(CLIENT_REPOSITORY)
        private readonly clientRepository: ClientRepositoryInterface,
    ) {}

    async execute(clientId: string): Promise<ClientEntity> {
        const client = await this.clientRepository.findById(clientId);
        if (!client) {
            throw new NotFoundException('Client not found');
        }
        return client;
    }
}
