import { Module } from '@nestjs/common';
import { LimitedStockService } from './limited-stock.service';
import { LimitedStockController } from './limited-stock.controller';

@Module({
  providers: [LimitedStockService],
  controllers: [LimitedStockController],
})
export class LimitedStockModule {}
