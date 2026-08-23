import { SequelizeModuleAsyncOptions } from "@nestjs/sequelize";
import { ConfigModule, ConfigService } from "@nestjs/config";

export const sequelizeConfig: SequelizeModuleAsyncOptions = {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
        return {
            dialect: 'postgres' as const,
            host: configService.get<string>('DB_HOST'),
            port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
            username: configService.get<string>('DB_USERNAME'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_NAME'),
            autoLoadModels: true,
            // Training default: create/update tables from models. Prefer migrations in production.
            synchronize: configService.get<string>('DB_SYNC', 'true') === 'true',
        };
    },
};