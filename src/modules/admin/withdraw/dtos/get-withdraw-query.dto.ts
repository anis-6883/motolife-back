import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { REFUND_STATUS } from 'src/common/enums/orders.enum';
import { WITHDRAW_STATUS } from 'src/common/models/withdraw.schema';

export class GetWithdrawQueryDto {
  @Type(() => Number)
  @IsOptional()
  page: number;

  @Type(() => Number)
  @IsOptional()
  limit: number;

  @IsOptional()
  @IsEnum(WITHDRAW_STATUS)
  status?: WITHDRAW_STATUS;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsMongoId()
  seller?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  date?: string;
}
