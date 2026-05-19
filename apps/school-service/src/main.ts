import { NestFactory } from '@nestjs/core';
import { SchoolServiceModule } from './school-service.module';

async function bootstrap() {
  const app = await NestFactory.create(SchoolServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
