import { Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class GetReviewsQueryDto {
  @Type(() => Number)
  @IsOptional()
  page: number;

  @Type(() => Number)
  @IsOptional()
  limit: number;

  @IsOptional()
  search: string;

  @IsOptional()
  @Transform(({ value }) => value && new Types.ObjectId(value))
  productId: Types.ObjectId;

  @IsOptional()
  @Transform(({ value }) => value && new Types.ObjectId(value))
  customerId: Types.ObjectId;

  @IsOptional()
  @Transform(({ value }) => value && new Types.ObjectId(value))
  sellerId: Types.ObjectId;

  @IsOptional()
  @IsString()
  rating: string;

  @IsOptional()
  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  willPublish: string;

  @IsOptional()
  @IsString()
  sortBy: string;

  @IsOptional()
  @IsString()
  sortOrder: 'asc' | 'desc';
}
