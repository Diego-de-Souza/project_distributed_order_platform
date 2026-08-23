import { ClientEntity } from "src/domain/entities/client.entity";

export function toClientResponse(client: ClientEntity) {
    return {
        id: client.getId(),
        name: client.getName(),
        email: client.getEmail(),
        status: client.getStatus(),
        createdAt: client.getCreatedAt(),
        updatedAt: client.getUpdatedAt(),
    };
}
