import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ProductSortFields } from 'src/common/enums/customer.enums';

export class GetOfferItemsQueryDto {
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
