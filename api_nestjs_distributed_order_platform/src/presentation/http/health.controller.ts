import { Controller, Get } from "@nestjs/common";
import { HealthService } from "src/application/service/health.service";

@Controller('health')
export class HealthController {
    constructor(
        private readonly healthService: HealthService,
    ) {}

    @Get('sequelize')
    async checkSequelize() {
        return this.healthService.checkDatabase();
    }

    @Get('redis')
    async checkRedis() {
        return this.healthService.checkRedis();
    }

    @Get()
    async health() {
        const db = await this.healthService.checkDatabase();
        const redis = await this.healthService.checkRedis();
        const allOk = db.status === 'connected' && redis.status === 'connected';
        return {
            status: allOk ? 'ok' : 'degraded',
            database: db,
            redis,
            timestamp: new Date().toISOString(),
        };
    }
}
