import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { CreateClientUseCase } from "src/application/use-case/client/create-client.use-case";
import { GetClientUseCase } from "src/application/use-case/client/get-client.use-case";
import { ClientRepository } from "src/infrastructure/persistence/postgres/client-repository";
import { ClientModel } from "src/infrastructure/persistence/postgres/models/client.model";
import { ClientController } from "src/presentation/http/client.controller";
import { CLIENT_REPOSITORY } from "src/shared/tokens_nest/client.token";

@Module({
    imports: [SequelizeModule.forFeature([ClientModel])],
    controllers: [ClientController],
    providers: [
        ClientRepository,
        {
            provide: CLIENT_REPOSITORY,
            useClass: ClientRepository,
        },
        CreateClientUseCase,
        GetClientUseCase,
    ],
    exports: [CLIENT_REPOSITORY, CreateClientUseCase, GetClientUseCase],
})
export class ClientModule {}
