import {
    BadRequestException,
    CallHandler,
    ConflictException,
    ExecutionContext,
    HttpStatus,
    Inject,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import { catchError, Observable, of, tap, throwError } from "rxjs";
import { IDEMPOTENCY_STORE } from "src/shared/tokens_nest/redis.token";
import type { IdempotencyStoreInterface } from "src/application/port/idempotency.repository";

@Injectable()
export class IdempotencyBodyInterceptor implements NestInterceptor {
    constructor(
        @Inject(IDEMPOTENCY_STORE)
        private readonly idempotencyStore: IdempotencyStoreInterface,
    ) {}

    private readonly TTL_SECONDS = 60 * 60 * 12; // 12 horas

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        const idempotencyKey = request.headers['idempotency-key'];

        if (!idempotencyKey) {
            throw new BadRequestException('Idempotency-Key header is required');
        }

        const isStarted = await this.idempotencyStore.tryStart(idempotencyKey, this.TTL_SECONDS);

        if (!isStarted) {
            // Alguém já reservou essa chave antes — precisamos saber o QUÊ
            // aconteceu com ela, não assumir direto que é conflito.
            const record = await this.idempotencyStore.get(idempotencyKey);

            if (record?.status === 'COMPLETED') {
                // Repetição de uma operação que já terminou: devolve a
                // resposta salva, sem rodar o handler de novo.
                response.status(record.statusCode ?? HttpStatus.OK);
                return of(record.body);
            }

            if (record?.status === 'IN_PROGRESS') {
                // Outra requisição com essa mesma chave está rodando agora.
                throw new ConflictException('A request with this idempotency key is already in progress');
            }

            // Caso raro: a chave sumiu entre o tryStart e o get (por exemplo,
            // a outra requisição falhou e chamou release() nesse meio-tempo).
            // Trata como se fosse a primeira tentativa.
            const retried = await this.idempotencyStore.tryStart(idempotencyKey, this.TTL_SECONDS);
            if (!retried) {
                throw new ConflictException('A request with this idempotency key is already in progress');
            }
        }

        return next.handle().pipe(
            tap({
                next: async (responseBody) => {
                    await this.idempotencyStore.complete(
                        idempotencyKey,
                        response.statusCode || HttpStatus.OK,
                        responseBody,
                        this.TTL_SECONDS,
                    );
                },
            }),
            catchError((err) => {
                this.idempotencyStore.release(idempotencyKey).catch(() => {});
                return throwError(() => err);
            }),
        );
    }
}