import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { ORDER_STATUS } from 'src/common/models/order.schema';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsEnum(ORDER_STATUS)
  @IsOptional()
  status?: ORDER_STATUS;

  @IsDate()
  @IsOptional()
  deliveredAt?: Date;

  @IsDate()
  @IsOptional()
  cancelledAt?: Date;

  @IsString()
  @IsOptional()
  cancellationReason?: string;

  @IsString()
  @IsOptional()
  cancellationNote?: string;

  @IsBoolean()
  @IsOptional()
  softDeleted?: boolean;
}
