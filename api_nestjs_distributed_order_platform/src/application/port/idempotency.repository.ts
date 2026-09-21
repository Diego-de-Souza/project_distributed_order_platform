export type IdempotencyStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface IdempotencyRecord {
    status: IdempotencyStatus;
    statusCode?: number;
    body?: unknown;
}

export interface IdempotencyStoreInterface {
    /**
     * Tenta reservar a chave atomicamente. true = esta chamada "ganhou a
     * corrida" e deve executar a operação. false = a chave já existe
     * (em andamento ou já concluída) — quem chamou perdeu a corrida.
     */
    tryStart(key: string, ttlSeconds: number): Promise<boolean>;

    /** Lê o estado atual gravado pra essa chave (ou null se não existe). */
    get(key: string): Promise<IdempotencyRecord | null>;

    /** Marca como concluída, salvando a resposta pra replay em retries futuros. */
    complete(key: string, statusCode: number, body: unknown, ttlSeconds: number): Promise<void>;

    /** Libera a chave (a operação falhou) pra permitir nova tentativa com a mesma chave. */
    release(key: string): Promise<void>;
}