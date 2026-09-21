import { ClientEntity } from "@/domain/entities/client.entity";
import { StatusClient } from "@/shared/enums/status-client.enum";

describe('ClientEntity', () => {
    describe('constructor', () => {
        it('should create a client entity', () => {
            const client = new ClientEntity('Diego de Souza', 'diego@example.com');

            expect(client.getId()).toBeDefined();
            expect(client.getName()).toBe('Diego de Souza');
            expect(client.getEmail()).toBe('diego@example.com');
        });

        it('should create a client entity 2', ()=>{
            const client = new ClientEntity('Diego de Souza', 'diego@example.com', StatusClient.ACTIVE, '1234567890');

            expect(client.getId()).toBe('1234567890');
            expect(client.getName()).toBe('Diego de Souza');
            expect(client.getEmail()).toBe('diego@example.com');
            expect(client.getStatus()).toBe(StatusClient.ACTIVE);
        });

        it('throws if name is missing', () => {
            expect(() => new ClientEntity('', 'diego@example.com')).toThrow('Name is required');
        });

        it('throws if email is missing', () => {
            expect(() => new ClientEntity('Diego de Souza', '')).toThrow('Email is required');
        });
    });

    describe('canCreateOrder', () => {
        it('should return true if the client is active', () => {
            const client = new ClientEntity('Diego de Souza', 'diego@example.com');

            expect(client.canCreateOrder()).toBe(true);
        });
    });
});