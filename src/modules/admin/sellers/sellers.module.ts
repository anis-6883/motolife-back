import { Module } from '@nestjs/common';
import { SellerService } from './sellers.service';
import { SellerController } from './sellers.controller';
import { CreateSellerProvider } from './providers/create-seller.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { Seller, SellerSchema } from 'src/common/models/seller.schema';
import { RoleModule } from '../role/role.module';
import {
  ComboProduct,
  ComboProductSchema,
} from 'src/common/models/combo-products.schema';
import { Withdraw, WithdrawSchema } from 'src/common/models/withdraw.schema';

@Module({
  controllers: [SellerController],
  providers: [SellerService, CreateSellerProvider],
  exports: [SellerService],
  imports: [
    RoleModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Seller.name,
        schema: SellerSchema,
      },
      {
        name: ComboProduct.name,
        schema: ComboProductSchema,
      },
      {
        name: Withdraw.name,
        schema: WithdrawSchema,
      },
    ]),
  ],
})
export class SellerModule {}
