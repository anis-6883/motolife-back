import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from '../../../common/models/cart.schema';
import { Product, ProductSchema } from '../../../common/models/products.schema';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Cart.name,
        schema: CartSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
  ],
})
export class CartModule {}
