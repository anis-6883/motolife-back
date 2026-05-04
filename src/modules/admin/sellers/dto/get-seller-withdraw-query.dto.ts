import {
  IsOptional,
  IsString,
  IsIn,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetSellerWithdrawQueryDto {
  @IsOptional()
  @IsString()
  // @IsIn(['createdAt', 'amount', 'status'])
  sortBy: string = 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder: string = 'desc';

  @IsOptional()
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;
}
