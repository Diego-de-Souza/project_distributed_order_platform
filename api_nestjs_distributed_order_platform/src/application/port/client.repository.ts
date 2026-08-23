import { ClientEntity } from "src/domain/entities/client.entity";

export interface ClientRepositoryInterface {
    create(client: ClientEntity): Promise<ClientEntity>;
    findById(clientId: string): Promise<ClientEntity | null>;
    findAll(): Promise<ClientEntity[]>;
    update(client: ClientEntity): Promise<void>;
    delete(clientId: string): Promise<void>;
}
