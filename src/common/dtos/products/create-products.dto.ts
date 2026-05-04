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
import {
  DISCOUNT_TYPE,
  PRODUCT_STATUS,
  UNIT,
} from 'src/common/enums/products.enum';

export class SizeGuideDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images: string[];

  @IsString()
  @IsOptional()
  description: string;
}

export class ColorImageDto {
  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsNotEmpty()
  image: string;
}

export class VideoLink {
  @IsString()
  @IsNotEmpty()
  @Matches(
    /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/,
    {
      message: 'url must be a valid YouTube video link',
    },
  )
  url: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  thumbnail: string;
}

export class AttributeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class FaqDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class VariantDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  @IsOptional()
  attributes: AttributeDto[];

  @IsString()
  @IsNotEmpty()
  variation: string;

  @IsNumber()
  @IsNotEmpty()
  variantPrice: number;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber()
  @IsNotEmpty()
  stock: number;

  @IsBoolean()
  @IsOptional()
  isDamaged: boolean;

  @IsString()
  @IsOptional()
  damageType: string;

  @IsString()
  @IsOptional()
  damageDescription: string;

  @IsNumber()
  @IsOptional()
  damagePercentage: number;

  @IsBoolean()
  @IsOptional()
  hasDiscount: boolean;

  @ValidateIf((o) => o.hasDiscount)
  @IsEnum(DISCOUNT_TYPE)
  @IsNotEmpty()
  discountType: DISCOUNT_TYPE;

  @ValidateIf((o) => o.hasDiscount)
  @IsNumber()
  @IsNotEmpty()
  discountPrice: number;

  @ValidateIf((o) => o.hasDiscount)
  @IsNumber()
  @IsNotEmpty()
  discountValue: number;
}

export class CreateProductDto {
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

  @IsNotEmpty()
  @Transform(({ value }) => new Types.ObjectId(value))
  category: Types.ObjectId;

  @IsOptional()
  @Transform(({ value }) => (value ? new Types.ObjectId(value) : null))
  subCategory: Types.ObjectId;

  @IsOptional()
  @Transform(({ value }) => (value ? new Types.ObjectId(value) : null))
  brand: Types.ObjectId;

  @IsEnum(UNIT)
  @IsNotEmpty()
  unit: UNIT;

  @IsString()
  @IsOptional()
  shippingTime: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  searchTags: string[];

  @IsString()
  @IsNotEmpty()
  thumbnail: string;

  @IsOptional()
  @Transform(({ value }) => (value ? new Types.ObjectId(value) : null))
  seller: Types.ObjectId;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoLink)
  @IsOptional()
  videoLinks: VideoLink[];

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
  @IsNotEmpty()
  buyingPrice: number;

  @IsNumber()
  @IsNotEmpty()
  stockQuantity: number;

  @IsString()
  @IsOptional()
  weight: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqDto)
  @IsOptional()
  faq: FaqDto[];

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

  @IsOptional()
  @Transform(({ value }) => (value ? new Types.ObjectId(value) : null))
  benefit: Types.ObjectId;

  @IsOptional()
  @ValidateNested()
  @Type(() => SizeGuideDto)
  sizeGuide: SizeGuideDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColorImageDto)
  @IsOptional()
  colorWiseImages: ColorImageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  @IsOptional()
  variants: VariantDto[];

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

  @IsEnum(PRODUCT_STATUS)
  @IsOptional()
  status: PRODUCT_STATUS;

  @IsBoolean()
  @IsOptional()
  isDamaged: boolean;

  @IsString()
  @IsOptional()
  damageType: string;

  @IsString()
  @IsOptional()
  damageDescription: string;
}
