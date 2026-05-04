import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { DISCOUNT_TYPE } from 'src/common/enums/products.enum';
import { RESOURCE_TYPE } from 'src/common/models/offers&deals.schema';

export class OffersItemDto {
  @IsNotEmpty()
  @IsString()
  product: Types.ObjectId;

  //   @IsOptional()
  //   @IsString()
  //   productName: string;

  //   @IsOptional()
  //   @IsString()
  //   thumbnail: string;

  //   @IsOptional()
  //   @IsString()
  //   seller: Types.ObjectId;

  //   @IsOptional()
  //   @IsString()
  //   sku: string;

  //   @IsOptional()
  //   @IsString()
  //   brand: Types.ObjectId;

  //   @IsOptional()
  //   @IsNumber()
  //   unitPrice: number;

  // @IsNotEmpty()
  // @IsOptional()
  // @IsBoolean()
  // hasDiscount: boolean;

  // @ValidateIf((o) => o.hasDiscount)
  @IsOptional()
  @IsNumber()
  discountPrice: number;

  // @ValidateIf((o) => o.hasDiscount)
  @IsNotEmpty()
  @IsString()
  discountType: DISCOUNT_TYPE;

  // @ValidateIf((o) => o.hasDiscount)
  @IsNotEmpty()
  @IsNumber()
  discountValue: number;
}

export class CreateOffersDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  image: string;

  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsString()
  startDate: string;

  @IsNotEmpty()
  @IsString()
  endDate: string;

  @IsOptional()
  @IsString()
  seller?: Types.ObjectId;

  @IsOptional()
  @IsString()
  category?: Types.ObjectId;

  @IsOptional()
  @IsString()
  comboProduct?: Types.ObjectId;

  @IsOptional()
  @IsString()
  product?: Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsEnum(RESOURCE_TYPE)
  resourceType?: RESOURCE_TYPE;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OffersItemDto)
  items?: OffersItemDto[];
}
