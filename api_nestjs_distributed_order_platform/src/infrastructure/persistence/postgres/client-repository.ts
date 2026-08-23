import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import type { ClientRepositoryInterface } from "src/application/port/client.repository";
import { ClientEntity } from "src/domain/entities/client.entity";
import { ClientModel } from "./models/client.model";

@Injectable()
export class ClientRepository implements ClientRepositoryInterface {
    constructor(
        @InjectModel(ClientModel) private readonly clientModel: typeof ClientModel,
    ) {}

    async create(client: ClientEntity): Promise<ClientEntity> {
        const created = await this.clientModel.create({
            name: client.getName(),
            email: client.getEmail(),
            status: client.getStatus(),
            created_at: client.getCreatedAt(),
            updated_at: client.getUpdatedAt(),
        });

        return this.toEntity(created);
    }

    async findById(clientId: string): Promise<ClientEntity | null> {
        const client = await this.clientModel.findByPk(clientId);
        return client ? this.toEntity(client) : null;
    }

    async findAll(): Promise<ClientEntity[]> {
        const clients = await this.clientModel.findAll();
        return clients.map((client) => this.toEntity(client));
    }

    async update(client: ClientEntity): Promise<void> {
        await this.clientModel.update(
            {
                name: client.getName(),
                email: client.getEmail(),
                status: client.getStatus(),
                updated_at: new Date(),
            },
            { where: { id: client.getId() } },
        );
    }

    async delete(clientId: string): Promise<void> {
        await this.clientModel.destroy({ where: { id: clientId } });
    }

    private toEntity(client: ClientModel): ClientEntity {
        return new ClientEntity(
            client.name,
            client.email,
            client.status,
            client.id,
            client.created_at,
            client.updated_at,
        );
    }
}
