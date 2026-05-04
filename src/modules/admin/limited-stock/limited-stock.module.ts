import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { RoleModule } from '../role/role.module';
import { LimitedStockService } from './limited-stock.service';
import { LimitedStockController } from './limited-stock.controller';
import {
  LimitedStock,
  LimitedStockSchema,
} from 'src/common/models/limited-stocks.schema';

@Module({
  controllers: [LimitedStockController],
  providers: [LimitedStockService],
  exports: [LimitedStockService],
  imports: [
    RoleModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: LimitedStock.name,
        schema: LimitedStockSchema,
      },
    ]),
  ],
})
export class LimitedStockModule {}
