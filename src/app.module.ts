import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigType } from '@nestjs/config';
import envValidation from './config/env.validation';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import authConfig from './config/auth.config';
import s3Config from './config/storage.config';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from './modules/admin/admin.module';
import { CommonModule } from './common/common.module';
import { CustomerModule } from './modules/customer/customer.module';
import { SellerModule } from './modules/seller/seller.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/exception-filter';
import steadfastConfig from './config/steadfast.config';
import emailConfig from './config/email.config';
import youtubeConfig from './config/youtube.config';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !ENV ? '.env' : `.env.${ENV}`,
      load: [
        appConfig,
        databaseConfig,
        authConfig,
        s3Config,
        steadfastConfig,
        emailConfig,
        youtubeConfig,
      ],
      validationSchema: envValidation,
      cache: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [databaseConfig.KEY],
      useFactory: (configService: ConfigType<typeof databaseConfig>) => ({
        uri: configService.databaseUrl,
      }),
    }),
    SellerModule,
    CustomerModule,
    AdminModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
