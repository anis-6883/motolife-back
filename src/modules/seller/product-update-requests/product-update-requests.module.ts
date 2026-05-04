import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductUpdateRequestsController } from './product-update-requests.controller';
import { ProductUpdateRequestsService } from './product-update-requests.service';
import {
  UpdateRequests,
  UpdateRequestsSchema,
} from 'src/common/models/products-update-requests.schema';
import { Product, ProductSchema } from 'src/common/models/products.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UpdateRequests.name, schema: UpdateRequestsSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [ProductUpdateRequestsController],
  providers: [ProductUpdateRequestsService],
})
export class ProductUpdateRequestsModule {}
