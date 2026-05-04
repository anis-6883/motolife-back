import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import {
  Availability,
  ProductSortFields,
} from 'src/common/enums/customer.enums';
import { PRODUCT_STATUS } from 'src/common/enums/products.enum';

export class GetComboProductsQueryDto {
  @Type(() => Number)
  @IsOptional()
  page: number;

  @IsOptional()
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsOptional()
  limit: number;

  @IsOptional()
  search: string;

  @IsOptional()
  @IsEnum(ProductSortFields)
  sortBy: ProductSortFields = ProductSortFields.CREATED_AT;

  @IsOptional()
  sortOrder: string;

  @IsOptional()
  seller: string;

  @IsOptional()
  date: string;

  @IsOptional()
  status: PRODUCT_STATUS;

  @IsOptional()
  isPublished: string;

  @IsOptional()
  isNew: string;

  @IsOptional()
  isFeatured: string;

  @IsOptional()
  isUpcoming: string;

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
  availability: string;

  @IsOptional()
  @IsString()
  rating?: string;
}
