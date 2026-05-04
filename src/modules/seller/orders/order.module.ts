import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../../../common/models/products.schema';
import { CommonModule } from 'src/common/common.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Cart, CartSchema } from 'src/common/models/cart.schema';
import { Customer, CustomerSchema } from 'src/common/models/customers.schema';

@Module({
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: Cart.name,
        schema: CartSchema,
      },
      {
        name: Customer.name,
        schema: CustomerSchema,
      },
    ]),
  ],
})
export class OrderModule {}
