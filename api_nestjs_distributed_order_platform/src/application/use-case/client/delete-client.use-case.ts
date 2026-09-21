import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { ClientRepositoryInterface } from "src/application/port/client.repository";
import { CLIENT_REPOSITORY } from "src/shared/tokens_nest/client.token";

@Injectable()
export class DeleteClientUseCase {
    constructor(
        @Inject(CLIENT_REPOSITORY)
        private readonly clientRepository: ClientRepositoryInterface,
    ) {}

    async execute(clientId: string): Promise<void> {
        const client = await this.clientRepository.findById(clientId);
        if (!client) {
            throw new NotFoundException('Client not found');
        }

        await this.clientRepository.delete(clientId);
    }
}
