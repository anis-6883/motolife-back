import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ORDER_STATUS } from 'src/common/models/order.schema';

export class OrderQueryDto {
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
  orderId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
