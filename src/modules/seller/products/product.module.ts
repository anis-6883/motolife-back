import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { Product, ProductSchema } from 'src/common/models/products.schema';
import {
  UpdateRequests,
  UpdateRequestsSchema,
} from 'src/common/models/products-update-requests.schema';

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
        name: UpdateRequests.name,
        schema: UpdateRequestsSchema,
      },
    ]),
  ],
})
export class ProductModule {}
