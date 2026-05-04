import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

export const createApp = (app: INestApplication) => {
  app.use(helmet());
  app.use(compression());

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Template NestJS')
    .setDescription('Use the base url as http://localhost:8000')
    .addServer('http://localhost:8000')
    .addServer('http://localhost:8001')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document);

  app.enableCors({
    origin: ['*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Content-Length',
      'Accept',
      'Origin',
      'Host',
    ],
  });
};
