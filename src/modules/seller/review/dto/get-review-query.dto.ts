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
  @Transform(({ value }) => new Types.ObjectId(value))
  productId: Types.ObjectId;

  @IsOptional()
  @Transform(({ value }) => new Types.ObjectId(value))
  customerId: Types.ObjectId;

  @IsOptional()
  @IsNumber()
  rating: number;

  @IsOptional()
  @IsString()
  date: string;
}
