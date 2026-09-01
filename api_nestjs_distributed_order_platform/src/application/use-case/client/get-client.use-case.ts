import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { ClientRepositoryInterface } from "src/application/port/client.repository";
import type { CacheStoreInterface } from "src/application/port/redis-store.repository";
import { ClientEntity } from "src/domain/entities/client.entity";
import { CLIENT_REPOSITORY } from "src/shared/tokens_nest/client.token";
import { CACHE_STORE } from "src/shared/tokens_nest/redis.token";

const CLIENT_CACHE_TTL_SECONDS = 300;
@Injectable()
export class GetClientUseCase {
    constructor(
        @Inject(CLIENT_REPOSITORY)
        private readonly clientRepository: ClientRepositoryInterface,
        @Inject(CACHE_STORE)
        private readonly cacheStore: CacheStoreInterface,
    ) {}

    async execute(clientId: string): Promise<ClientEntity> {
        const cacheKey = `client:${clientId}`;

        const cached = await this.cacheStore.get<{
            id: string;
            name: string;
            email: string;
            status: ClientEntity['getStatus'] extends () => infer S ? S : never;
            createdAt: Date;
            updatedAt: Date;
        }>(cacheKey);
        
        if (cached) {
            return new ClientEntity(cached.name, cached.email, cached.status, cached.id, new Date(cached.createdAt), new Date(cached.updatedAt),);
        }

        const client = await this.clientRepository.findById(clientId);
        if (!client) {
            throw new NotFoundException('Client not found');
        }

        await this.cacheStore.set(cacheKey, {
            id: client.getId(),
            name: client.getName(),
            email: client.getEmail(),
            status: client.getStatus(),
            createdAt: client.getCreatedAt(),
            updatedAt: client.getUpdatedAt(),
        }, CLIENT_CACHE_TTL_SECONDS);

        return client;
    }
}
