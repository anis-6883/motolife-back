import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class GetLimitedStockQueryDto {
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  search: string;

  @IsOptional()
  category: string;

  @IsOptional()
  brand: string;

  @IsOptional()
  isPublished: string;

  @IsOptional()
  @IsString()
  sortOrder: string;

  @IsOptional()
  @IsString()
  sortBy: string;
}
