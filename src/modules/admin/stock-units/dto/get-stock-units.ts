import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  isString,
  IsString,
  Min,
} from 'class-validator';

export class GetStockUnitsQueryDto {
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  page: number;

  @Type(() => Number)
  @IsOptional()
  limit: number;

  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  sku: string;

  @IsOptional()
  @IsString()
  variation: string;

  @IsOptional()
  @IsString()
  sortBy: string;

  @IsOptional()
  @IsString()
  isDamaged: string;

  @IsOptional()
  @IsString()
  sortOrder: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  p: string;
}
