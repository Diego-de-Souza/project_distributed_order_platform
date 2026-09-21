import { GetClientUseCase } from "@/application/use-case/client/get-client.use-case";
import { NotFoundException } from "@nestjs/common";
import { ClientRepositoryInterface } from "src/application/port/client.repository";
import { CacheStoreInterface } from "src/application/port/redis-store.repository";
import { ClientEntity } from "src/domain/entities/client.entity";
import { StatusClient } from "src/shared/enums/status-client.enum";

describe('GetClientUseCase', () => {
    let clientRepository: jest.Mocked<ClientRepositoryInterface>;
    let cacheStore: jest.Mocked<CacheStoreInterface>;
    let useCase: GetClientUseCase;

    beforeEach(() => {
        clientRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        cacheStore = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        };
        useCase = new GetClientUseCase(clientRepository, cacheStore);
    });

    it('returns the client from cache without touching the repository', async () => {
        cacheStore.get.mockResolvedValue({
            id: 'client-1',
            name: 'Client 1',
            email: 'client1@example.com',
            status: StatusClient.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        
        const result = await useCase.execute('client-1');

        expect(result).toBeInstanceOf(ClientEntity);
        expect(result.getId()).toBe('client-1');
        expect(result.getName()).toBe('Client 1');
        expect(result.getEmail()).toBe('client1@example.com');
        expect(result.getStatus()).toBe(StatusClient.ACTIVE);
        expect(cacheStore.get).toHaveBeenCalledWith('client:client-1');
        expect(clientRepository.findById).not.toHaveBeenCalled();
        expect(cacheStore.set).not.toHaveBeenCalled();
    });

    it('falls back to the repository on cache miss and populates the cache', async () => {
        cacheStore.get.mockResolvedValue(null);
        const client = new ClientEntity('Client 1', 'client1@example.com', StatusClient.ACTIVE, 'client-1');
        clientRepository.findById.mockResolvedValue(client);

        const result = await useCase.execute('client-1');
        const data  = new Date()

        expect(result).toBe(client);
        expect(clientRepository.findById).toHaveBeenCalledWith('client-1');
        expect(cacheStore.set).toHaveBeenCalledWith('client:client-1', { id: 'client-1', name: 'Client 1', email: 'client1@example.com', status: StatusClient.ACTIVE, createdAt: data, updatedAt: data }, 300);
    });

    it('throws NotFoundException when the client does not exist anywhere', async () => {
        cacheStore.get.mockResolvedValue(null);
        clientRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute('missing-id')).rejects.toThrow(NotFoundException);
        expect(cacheStore.set).not.toHaveBeenCalled();
    });
    
    it('throws NotFoundException when the client does not exist in the repository', async () => {
        cacheStore.get.mockResolvedValue(null);
        clientRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute('missing-id')).rejects.toThrow(NotFoundException);
        expect(cacheStore.set).not.toHaveBeenCalled();
    });
});