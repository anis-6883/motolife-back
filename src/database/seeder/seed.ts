import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(SeederModule);
  const seeder = appContext.get(SeederService);
  try {
    await seeder.seed();
  } catch (error) {
    console.error('Seeding failed', error);
  } finally {
    await appContext.close();
  }
}
bootstrap();
