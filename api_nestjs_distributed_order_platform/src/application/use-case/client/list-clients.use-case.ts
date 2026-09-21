import { Inject, Injectable } from "@nestjs/common";
import type { ClientRepositoryInterface } from "src/application/port/client.repository";
import { ClientEntity } from "src/domain/entities/client.entity";
import { CLIENT_REPOSITORY } from "src/shared/tokens_nest/client.token";

@Injectable()
export class ListClientsUseCase {
    constructor(
        @Inject(CLIENT_REPOSITORY)
        private readonly clientRepository: ClientRepositoryInterface,
    ) {}

    async execute(): Promise<ClientEntity[]> {
        return this.clientRepository.findAll();
    }
}
