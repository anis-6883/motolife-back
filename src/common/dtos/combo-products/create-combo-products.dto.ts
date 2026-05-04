import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsArray,
  IsNotEmpty,
  ValidateNested,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { DISCOUNT_TYPE } from 'src/common/enums/products.enum';

export class VideoLink {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  thumbnail: string;
}

export class SizeGuideDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images: string[];

  @IsString()
  @IsOptional()
  description: string;
}

export class FaqDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class CreateComboProductDto {
  @IsString()
  @IsOptional()
  productId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?!\d+$).+$/, {
    message: 'Name cannot consist of only numbers',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  shippingTime: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  searchTags: string[];

  @IsString()
  thumbnail: string;

  @IsOptional()
  @Transform(({ value }) => new Types.ObjectId(value))
  seller: Types.ObjectId;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images: string[];

  @IsNumber()
  @IsNotEmpty()
  sellingPrice: number;

  @IsBoolean()
  @IsOptional()
  hasDiscount: boolean;

  @ValidateIf((o) => o.hasDiscount)
  @IsNumber()
  @IsNotEmpty()
  discountValue: number;

  @ValidateIf((o) => o.hasDiscount)
  @IsEnum(DISCOUNT_TYPE)
  @IsNotEmpty()
  discountType: DISCOUNT_TYPE;

  @ValidateIf((o) => o.hasDiscount)
  @IsNumber()
  @IsNotEmpty()
  discountPrice: number;

  @IsNumber()
  @IsOptional()
  buyingPrice: number;

  @IsNumber()
  stockQuantity: number;

  @IsOptional()
  @Transform(({ value }) => (value ? new Types.ObjectId(value) : null))
  benefit: Types.ObjectId;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqDto)
  @IsOptional()
  faq: FaqDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SizeGuideDto)
  sizeGuide: SizeGuideDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoLink)
  @IsOptional()
  videoLinks: VideoLink[];

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @Matches(/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/, {
    message:
      'Slug must contain only letters (lowercase or uppercase), numbers, and dashes.',
  })
  slug: string;

  @IsBoolean()
  @IsOptional()
  isPublished: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured: boolean;

  @IsBoolean()
  @IsOptional()
  isNewArrived: boolean;

  @IsBoolean()
  @IsOptional()
  isUpcoming: boolean;

  @IsBoolean()
  @IsOptional()
  hasOffer: boolean;
}
