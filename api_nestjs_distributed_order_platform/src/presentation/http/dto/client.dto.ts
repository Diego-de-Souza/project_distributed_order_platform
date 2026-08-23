import { StatusClient } from "src/shared/enums/status-client.enum";

export class CreateClientDto {
    name!: string;
    email!: string;
    status?: StatusClient;
}