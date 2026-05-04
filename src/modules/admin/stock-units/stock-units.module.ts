import { Module } from '@nestjs/common';
import { StockUnitService } from './stock-units.service';
import { StockUnitController } from './stock-units.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { StockUnits, StockUnitsSchema } from 'src/common/models/stock-units';
import { RoleModule } from '../role/role.module';

@Module({
  controllers: [StockUnitController],
  providers: [StockUnitService],
  exports: [StockUnitService],
  imports: [
    CommonModule,
    RoleModule,
    MongooseModule.forFeature([
      {
        name: StockUnits.name,
        schema: StockUnitsSchema,
      },
    ]),
  ],
})
export class StockUnitModule {}
