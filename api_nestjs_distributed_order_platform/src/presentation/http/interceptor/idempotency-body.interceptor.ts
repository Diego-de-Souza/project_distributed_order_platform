import { CallHandler, ExecutionContext, HttpStatus, Inject, Injectable, NestInterceptor } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "node:crypto";
import { Redis } from "ioredis";
import { catchError, Observable, of, tap, throwError } from "rxjs";
import { REDIS_CLIENT } from "src/shared/tokens_nest/redis.token";

@Injectable()
export class IdempotencyBodyInterceptor implements NestInterceptor {
    constructor(
        @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
        private readonly configService: ConfigService,
    ) {}
    private readonly TTL_SECONDS = 60 * 60 * 12; // 12 hours

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        const body = request.body;

        const bodyString = JSON.stringify(body);
        const hash = createHash('sha256').update(bodyString).digest('hex');

        const redisKey = `idempotency:body:${hash}`;

        const chacheRedis = await this.redisClient.get(redisKey);

        if (chacheRedis) {
            const cachedData = JSON.parse(chacheRedis);

            if (cachedData.headers){
                Object.entries(cachedData.headers).forEach(([key, value]) => {
                    response.header(key, String(value));
                });
            }

            response.status(cachedData.statusCode || HttpStatus.OK)

            return of(cachedData.body);
        }

        const ttl = this.configService.get<number>('redis.ttlIdempotency') || 43200;
        
        return next.handle().pipe(
            tap({
                next: async (ResponseBody) => {
                    const statusCode = response.statusCode || HttpStatus.OK;
                    const headers = response.getHeaders();

                    await this.redisClient.setex(
                        redisKey,
                        this.TTL_SECONDS,
                        JSON.stringify({
                            statusCode,
                            headers,
                            body: ResponseBody,
                        })
                    )
                },
                error: (err) => console.error('Failed to cache response for idempotency key:', err),
            }),
            catchError((err) => {
                this.redisClient.del(redisKey).catch(()=>{});
                return throwError(() => err);
            })
        )
    }
}