import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
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

  @IsOptional()
  @IsNumber()
  discountPrice: number;

  @IsNotEmpty()
  @IsString()
  discountType: DISCOUNT_TYPE;

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
  sellerId?: Types.ObjectId;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.resourceType === RESOURCE_TYPE.CATEGORY)
  categoryId?: Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsNotEmpty()
  @IsEnum(RESOURCE_TYPE)
  resourceType?: RESOURCE_TYPE;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Slug must be lowercase and contain only letters, numbers, and single dashes (cannot start or end with a dash).',
  })
  slug: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OffersItemDto)
  items?: OffersItemDto[];
}
