import { PartialType } from '@nestjs/mapped-types';
import { CreateStockUnitDto } from './create-stock-unit.dto';
import { Types } from 'mongoose';
import { IsOptional, IsString } from 'class-validator';

export class UpdateStockUnitDto extends PartialType(CreateStockUnitDto) {
  @IsString()
  @IsOptional()
  _id: string | Types.ObjectId;
}
