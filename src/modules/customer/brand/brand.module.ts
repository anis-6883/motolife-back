import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Brand, BrandSchema } from '../../../common/models/brand.schema';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [BrandController],
  providers: [BrandService],
  exports: [BrandService],
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Brand.name,
        schema: BrandSchema,
      },
    ]),
  ],
})
export class BrandModule {}
