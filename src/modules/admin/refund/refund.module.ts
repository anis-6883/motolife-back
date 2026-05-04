import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { RoleModule } from '../role/role.module';
import { Refund, RefundSchema } from 'src/common/models/refunds.schema';
import { RefundController } from './refund.controller';
import { RefundService } from './refund.service';
import { Seller, SellerSchema } from 'src/common/models/seller.schema';
import { Product, ProductSchema } from 'src/common/models/products.schema';
import { Customer, CustomerSchema } from 'src/common/models/customers.schema';
import { RefundAllProvider } from './providers/refund-all.provider';
import { RejectSingleProvider } from './providers/reject-single.provider';
import { RejectAllProvider } from './providers/reject-all.provider';
import { RefundSingleProvider } from './providers/refund-single.provider';

@Module({
  controllers: [RefundController],
  providers: [
    RefundService,
    RefundAllProvider,
    RefundSingleProvider,
    RejectAllProvider,
    RejectSingleProvider,
  ],
  exports: [RefundService],
  imports: [
    RoleModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Refund.name,
        schema: RefundSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: Seller.name,
        schema: SellerSchema,
      },
      {
        name: Customer.name,
        schema: CustomerSchema,
      },
    ]),
  ],
})
export class RefundModule {}
