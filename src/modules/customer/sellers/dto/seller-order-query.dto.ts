import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { ORDER_STATUS } from 'src/common/models/order.schema';

export class SellerOrdersQueryDto {
  @IsOptional()
  @IsEnum(ORDER_STATUS)
  status?: ORDER_STATUS;

  @IsOptional()
  @IsString()
  page?: string = '1';

  @IsOptional()
  @IsString()
  limit?: string = '10';

  @IsOptional()
  @IsString()
  @Type(() => Types.ObjectId)
  customer?: Types.ObjectId;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  date?: string;
}
