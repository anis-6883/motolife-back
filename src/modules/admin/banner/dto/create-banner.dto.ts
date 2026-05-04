import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Types } from 'mongoose';
import { BannerType, ResourceType } from 'src/common/models/banner.schema';

export class CreateBannerDto {
  @IsNotEmpty()
  @IsString()
  type: BannerType;

  @IsOptional()
  @IsEnum(ResourceType)
  resourceType: ResourceType;

  @IsOptional()
  @IsString()
  bannerUrl: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  buttonText: string;

  @IsNotEmpty()
  @IsString()
  image: string;

  @ValidateIf((o) => o.resourceType === ResourceType.CATEGORY)
  @IsNotEmpty({
    message: 'Category ID is required when resource type is CATEGORY',
  })
  @Transform(({ value }) =>
    Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value,
  )
  categoryId?: Types.ObjectId;

  @ValidateIf((o) => o.resourceType === ResourceType.PRODUCT)
  @IsNotEmpty({
    message: 'Product ID is required when resource type is PRODUCT',
  })
  @Transform(({ value }) =>
    Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value,
  )
  productId?: Types.ObjectId;

  @ValidateIf((o) => o.resourceType === ResourceType.COMBO)
  @IsNotEmpty({
    message: 'Combo Product ID is required when resource type is COMBO_OFFER',
  })
  @Transform(({ value }) =>
    Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value,
  )
  comboProductId?: Types.ObjectId;

  @ValidateIf((o) => o.resourceType === ResourceType.STORE)
  @IsNotEmpty({ message: 'Seller ID is required when resource type is STORE' })
  @Transform(({ value }) =>
    Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value,
  )
  sellerId?: Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
