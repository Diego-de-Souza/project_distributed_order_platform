import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './presentation/http/filters/http-exception.filter';
import { HealthController } from './presentation/http/health.controller';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.use('/health', HealthController);

  await app.listen(process.env.PORT ?? 3010);

  console.log(`Server is running on port ${process.env.PORT ?? 3010}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  
}
bootstrap();
