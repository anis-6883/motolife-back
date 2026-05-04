import { Module } from '@nestjs/common';
import { ComboProductService } from './combo-product.service';
import { ComboProductController } from './combo-product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import {
  ComboProduct,
  ComboProductSchema,
} from 'src/common/models/combo-products.schema';

@Module({
  controllers: [ComboProductController],
  providers: [ComboProductService],
  exports: [ComboProductService],
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: ComboProduct.name,
        schema: ComboProductSchema,
      },
    ]),
  ],
})
export class ComboProductModule {}
