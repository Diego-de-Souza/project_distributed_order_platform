import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './presentation/http/filters/http-exception.filter';
import { SwaggerModule } from '@nestjs/swagger';
import swaggerConfig from './config/openapi.config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new GlobalExceptionFilter());

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  app.useGlobalPipes(
    new ValidationPipe({
        whitelist: true,            // remove campos que não estão no DTO
        forbidNonWhitelisted: true, // rejeita a requisição se vier campo desconhecido
        transform: true,            // converte o JSON puro em instância real da classe do DTO
    }),
  );

  await app.listen(process.env.PORT ?? 3010);

  console.log(`Server is running on port ${process.env.PORT ?? 3010}`);
  console.log(`Swagger docs at http://localhost:${process.env.PORT ?? 3010}/docs`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  
}
bootstrap();
