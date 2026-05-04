import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { createApp } from './app.create';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  createApp(app);
  const port = process.env.PORT ?? 3006;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Application is running on port: ${port}`);
}

bootstrap().catch((err) => console.error(err));
