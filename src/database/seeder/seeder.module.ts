import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { SeederService } from './seeder.service';
import { Brand, BrandSchema } from 'src/common/models/brand.schema';
import { Category, CategorySchema } from 'src/common/models/category.schema';
import databaseConfig from 'src/config/database.config';
import appConfig from 'src/config/app.config';
import envValidation from 'src/config/env.validation';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !ENV ? '.env' : `.env.${ENV}`,
      load: [appConfig, databaseConfig],
      validationSchema: envValidation,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [databaseConfig.KEY],
      useFactory: (configService: ConfigType<typeof databaseConfig>) => ({
        uri: configService.databaseUrl,
      }),
    }),
    MongooseModule.forFeature([
      { name: Brand.name, schema: BrandSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
