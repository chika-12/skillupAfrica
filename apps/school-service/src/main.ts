import { NestFactory } from '@nestjs/core';
import { SchoolServiceModule } from './school-service.module';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    SchoolServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3002,
      },
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen();
}
bootstrap();
