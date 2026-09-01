import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
    correlationId: string;
}

export const correlationIdStorage = new AsyncLocalStorage<RequestContext>();

export function getCorrelationId(): string | undefined {
    return correlationIdStorage.getStore()?.correlationId;
}