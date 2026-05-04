import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { PAYMENT_METHOD, REFUND_STATUS } from 'src/common/enums/orders.enum';

export class UpdateRefundDto {
  @IsString()
  @IsOptional()
  note: string;

  @IsEnum(PAYMENT_METHOD)
  @IsOptional()
  refundMethod: PAYMENT_METHOD;

  @IsEnum(REFUND_STATUS)
  @IsOptional()
  status: REFUND_STATUS;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsString()
  @IsOptional()
  reason: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  details?: string;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;
}
