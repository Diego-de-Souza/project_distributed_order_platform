import { DocumentBuilder } from '@nestjs/swagger';

const swaggerConfig = new DocumentBuilder()
    .setTitle('Distributed Order Platform API')
    .setDescription('API de pedidos, estoque, pagamentos e clientes — projeto de treino')
    .setVersion('1.0')
    .build();


export default swaggerConfig;