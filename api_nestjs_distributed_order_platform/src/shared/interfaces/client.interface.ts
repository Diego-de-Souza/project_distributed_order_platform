import { StatusClient } from "../enums/status-client.enum";

export interface ClientAttributes {
    id?: string;
    name: string;
    email: string;
    status: StatusClient;
    created_at: Date;
    updated_at: Date;
}

export interface CreateClientInput {
    name: string;
    email: string;
    status?: StatusClient;
}