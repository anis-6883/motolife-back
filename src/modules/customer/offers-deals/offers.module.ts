import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { Offers, OffersSchema } from 'src/common/models/offers&deals.schema';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { Category, CategorySchema } from 'src/common/models/category.schema';

@Module({
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Offers.name,
        schema: OffersSchema,
      },
      {
        name: Category.name,
        schema: CategorySchema,
      },
    ]),
  ],
})
export class OffersModule {}
