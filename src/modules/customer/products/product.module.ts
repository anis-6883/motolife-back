import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { Product, ProductSchema } from 'src/common/models/products.schema';
import {
  RestockRequest,
  RestockRequestSchema,
} from 'src/common/models/restock-request.schema';

@Module({
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: RestockRequest.name,
        schema: RestockRequestSchema,
      },
    ]),
  ],
})
export class ProductModule {}
