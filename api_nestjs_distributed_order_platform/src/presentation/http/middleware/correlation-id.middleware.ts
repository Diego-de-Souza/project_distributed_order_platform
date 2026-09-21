import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { correlationIdStorage } from "src/shared/context/correlation_id.context";

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const incoming = req.headers['X-Correlation-Id'];
        const correlationId =
            typeof incoming === 'string' && incoming.length > 0
                ? incoming
                : randomUUID();

        res.setHeader('X-Correlation-Id', correlationId);

        correlationIdStorage.run({ correlationId }, () => {
            next();
        });
    }
}