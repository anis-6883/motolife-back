import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Banner, BannerSchema } from '../../../common/models/banner.schema';
import { CommonModule } from 'src/common/common.module';
import { RoleModule } from '../role/role.module';
import { Category, CategorySchema } from 'src/common/models/category.schema';
import {
  ComboProduct,
  ComboProductSchema,
} from 'src/common/models/combo-products.schema';

@Module({
  controllers: [BannerController],
  providers: [BannerService],
  exports: [BannerService],
  imports: [
    RoleModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Banner.name,
        schema: BannerSchema,
      },
      {
        name: Category.name,
        schema: CategorySchema,
      },
      {
        name: ComboProduct.name,
        schema: ComboProductSchema,
      },
    ]),
  ],
})
export class BannerModule {}
