import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { DeliveryService } from 'src/common/delivery/delivery.service';
import { Cart, CartSchema } from 'src/common/models/cart.schema';
import {
  ComboProduct,
  ComboProductSchema,
} from 'src/common/models/combo-products.schema';
import { Customer, CustomerSchema } from 'src/common/models/customers.schema';
import { Role, RoleSchema } from 'src/common/models/role.schema';
import { Seller, SellerSchema } from 'src/common/models/seller.schema';
import { Product, ProductSchema } from '../../../common/models/products.schema';
import { RoleModule } from '../role/role.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, DeliveryService],
  exports: [OrderService],
  imports: [
    CommonModule,
    RoleModule,
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
      {
        name: Role.name,
        schema: RoleSchema,
      },
      {
        name: Seller.name,
        schema: SellerSchema,
      },
      {
        name: ComboProduct.name,
        schema: ComboProductSchema,
      },
    ]),
  ],
})
export class OrderModule {}
