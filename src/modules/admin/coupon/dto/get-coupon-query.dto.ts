import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { CouponBearer, CouponType } from 'src/common/models/coupon.schema';

export class GetCouponQueryDto {
  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @IsOptional()
  @IsEnum(CouponBearer)
  bearer?: CouponBearer;

  @IsOptional()
  @IsMongoId()
  seller?: string;

  @IsOptional()
  @IsMongoId()
  customer?: string;

  @IsOptional()
  @IsString()
  date?: string;

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
  status: string;

  @IsOptional()
  @IsString()
  sortBy: string;

  @IsOptional()
  @IsString()
  sortOrder: 'asc' | 'desc';
}
