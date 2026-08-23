import { StatusClient } from "src/shared/enums/status-client.enum";

export class ClientEntity {
    private readonly createdAt: Date;
    private readonly updatedAt: Date;
    private readonly status: StatusClient;

    constructor(
        private readonly name: string,
        private readonly email: string,
        status?: StatusClient,
        private readonly id?: string,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        if (!name) {
            throw new Error('Name is required');
        }
        if (!email) {
            throw new Error('Email is required');
        }

        this.status = status ?? StatusClient.ACTIVE;
        this.createdAt = createdAt ?? new Date();
        this.updatedAt = updatedAt ?? new Date();
    }

    getId(): string {
        return this.id ?? '';
    }

    getName(): string {
        return this.name;
    }

    getEmail(): string {
        return this.email;
    }

    getStatus(): StatusClient {
        return this.status;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getUpdatedAt(): Date {
        return this.updatedAt;
    }

    canCreateOrder(): boolean {
        return this.status === StatusClient.ACTIVE;
    }
}
