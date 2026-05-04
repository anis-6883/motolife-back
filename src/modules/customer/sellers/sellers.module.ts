import { Module } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { SellersController } from './sellers.controller';
import { CreateSellerProvider } from './providers/create-seller.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { Seller, SellerSchema } from 'src/common/models/seller.schema';

@Module({
  controllers: [SellersController],
  providers: [SellersService, CreateSellerProvider],
  exports: [SellersService],
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Seller.name,
        schema: SellerSchema,
      },
    ]),
  ],
})
export class SellersModule {}
