import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  Availability,
  ProductSortFields,
} from 'src/common/enums/customer.enums';
import { PRODUCT_STATUS } from 'src/common/enums/products.enum';

export class GetProductsQueryDto {
  @Type(() => Number)
  @IsOptional()
  page: number;

  @Type(() => Number)
  @IsOptional()
  limit: number;

  @IsOptional()
  search: string;

  @IsOptional()
  category: string;

  @IsOptional()
  subCategory: string;

  @IsOptional()
  @IsString()
  brand: string;

  @IsOptional()
  isFeatured: string;

  @IsOptional()
  isPublished: string;

  @IsOptional()
  @IsString()
  availability: string;

  @IsOptional()
  seller: string;

  @IsOptional()
  isNew: string;

  @IsOptional()
  status: PRODUCT_STATUS;

  @IsOptional()
  @IsEnum(['true', 'false'])
  isDamaged: string;

  @IsOptional()
  @IsEnum(ProductSortFields)
  sortBy: ProductSortFields = ProductSortFields.CREATED_AT;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder: string;

  @IsOptional()
  @Transform(({ value }) => {
    const parsed = Number(value);
    return isNaN(parsed) ? value : parsed;
  })
  @IsNumber()
  fromPrice: number;

  @IsOptional()
  @Transform(({ value }) => {
    const parsed = Number(value);
    return isNaN(parsed) ? value : parsed;
  })
  @IsNumber()
  toPrice: number;

  @IsOptional()
  @IsString()
  rating?: string;
}
