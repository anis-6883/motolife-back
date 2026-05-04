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

  @IsOptional()
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
  @ValidateIf((o) => o.resourceType === RESOURCE_TYPE.STORE)
  seller?: Types.ObjectId;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.resourceType === RESOURCE_TYPE.CATEGORY)
  category?: Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsNotEmpty()
  @IsEnum(RESOURCE_TYPE)
  resourceType?: RESOURCE_TYPE;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OffersItemDto)
  items?: OffersItemDto[];
}
