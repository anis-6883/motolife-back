import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class GetCouponQueryDto {
  @Type(() => Number)
  @IsOptional()
  page: number;

  @Type(() => Number)
  @IsOptional()
  limit: number;

  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  hasExpired: string;

  @IsOptional()
  @IsString()
  used: string;
}
