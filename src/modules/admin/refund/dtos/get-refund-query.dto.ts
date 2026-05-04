import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { REFUND_STATUS } from 'src/common/enums/orders.enum';

export class GetRefundQueryDto {
  @Type(() => Number)
  @IsOptional()
  page: number;

  @Type(() => Number)
  @IsOptional()
  limit: number;

  @IsOptional()
  @IsEnum(REFUND_STATUS)
  status?: REFUND_STATUS;

  @IsOptional()
  @IsString()
  search?: string;
}
