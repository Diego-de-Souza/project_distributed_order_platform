import { Controller, Get } from "@nestjs/common";
import { HealthService } from "src/application/service/health.service";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private readonly healthService: HealthService,
    ) {}

    @Get('sequelize')
    @ApiOperation({ summary: 'Verifica o status do banco de dados' })
    @ApiResponse({ status: 200, description: 'Banco de dados conectado com sucesso' })
    @ApiResponse({ status: 500, description: 'Erro ao conectar ao banco de dados' })
    async checkSequelize() {
        return this.healthService.checkDatabase();
    }

    @Get('redis')
    @ApiOperation({ summary: 'Verifica o status do Redis' })
    @ApiResponse({ status: 200, description: 'Redis conectado com sucesso' })
    @ApiResponse({ status: 500, description: 'Erro ao conectar ao Redis' })
    async checkRedis() {
        return this.healthService.checkRedis();
    }

    @Get()
    @ApiOperation({ summary: 'Verifica o status do sistema' })
    @ApiResponse({ status: 200, description: 'Sistema funcionando normalmente' })
    @ApiResponse({ status: 500, description: 'Erro ao verificar o status do sistema' })
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
