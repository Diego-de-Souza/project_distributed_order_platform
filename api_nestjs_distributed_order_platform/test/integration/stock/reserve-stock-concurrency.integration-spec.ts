import { randomUUID } from 'node:crypto';
import { ConfigModule } from '@nestjs/config';
import { getModelToken, SequelizeModule } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { sequelizeConfig } from '@/config/sequelize.config';
import { StockModel } from '@/infrastructure/persistence/postgres/models/stock.model';
import { StockRepository } from '@/infrastructure/persistence/postgres/stock-repository';

describe('Stock reservation concurrency (integration)', () => {
    let moduleRef: TestingModule;
    let sequelize: Sequelize;
    let stockRepository: StockRepository;
    let stockModel: typeof StockModel;
    let productId: string;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
                SequelizeModule.forRootAsync(sequelizeConfig),
                SequelizeModule.forFeature([StockModel]),
            ],
            providers: [StockRepository],
        }).compile();

        sequelize = moduleRef.get(Sequelize);
        stockRepository = moduleRef.get(StockRepository);
        stockModel = moduleRef.get<typeof StockModel>(getModelToken(StockModel));
    });

    afterAll(async () => {
        await sequelize.close();
        await moduleRef.close();
    });

    beforeEach(async () => {
        // UUID novo a cada teste: evita resíduo de uma execução anterior
        // que tenha travado no meio do caminho e não limpado o próprio rastro
        productId = randomUUID();
        await stockModel.create({
            product_id: productId,
            available_quantity: 1,
            reserved_quantity: 0,
            version: 0,
        });
    });

    afterEach(async () => {
        await stockModel.destroy({ where: { product_id: productId } });
    });

    it('only allows one of two concurrent reservations when stock is 1', async () => {
        const attemptReserve = () =>
            sequelize.transaction((transaction) =>
                stockRepository.reserve(productId, 1, transaction),
            );

        const results = await Promise.allSettled([attemptReserve(), attemptReserve()]);

        const fulfilled = results.filter((r) => r.status === 'fulfilled');
        const rejected = results.filter((r) => r.status === 'rejected');

        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(1);

        const finalStock = await stockModel.findByPk(productId);
        expect(finalStock!.available_quantity).toBe(0);
        expect(finalStock!.reserved_quantity).toBe(1);
        expect(finalStock!.version).toBe(1); // só uma reserva realmente aconteceu
    });
});