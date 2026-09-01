import { CreateClientUseCase } from "@/application/use-case/client/create-client.use-case";
import { ClientRepositoryInterface } from "src/application/port/client.repository";
import { ClientEntity } from "src/domain/entities/client.entity";
import { StatusClient } from "src/shared/enums/status-client.enum";

describe('CreateClientUseCase', () => {
    let clientRepository: jest.Mocked<ClientRepositoryInterface>;
    let useCase: CreateClientUseCase;

    beforeEach(() => {
        clientRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        useCase = new CreateClientUseCase(clientRepository);
    });

    it('creates a client and persists it', async () => {
        const created = new ClientEntity(
            'Client 1',
            'client1@example.com',
            StatusClient.ACTIVE,
            'client-1',
        );
        clientRepository.create.mockResolvedValue(created);

        const result = await useCase.execute({
            name: 'Client 1',
            email: 'client1@example.com',
            status: StatusClient.ACTIVE,
        });

        expect(result).toBe(created);
        expect(clientRepository.create).toHaveBeenCalledTimes(1);
        const persisted = clientRepository.create.mock.calls[0][0];
        expect(persisted).toBeInstanceOf(ClientEntity);
        expect(persisted.getName()).toBe('Client 1');
        expect(persisted.getEmail()).toBe('client1@example.com');
        expect(persisted.getStatus()).toBe(StatusClient.ACTIVE);
    });
});
