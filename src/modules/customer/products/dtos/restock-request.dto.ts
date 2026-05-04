import {
  IsString,
  IsArray,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Types } from 'mongoose';

export class VariantRequestDto {
  @IsString()
  @IsNotEmpty()
  sku: string;
}

export class RestockRequestDto {
  @IsNotEmpty()
  @Transform(({ value }) => new Types.ObjectId(value))
  productId: Types.ObjectId;

  @IsOptional()
  @Type(() => VariantRequestDto)
  variantRequest: VariantRequestDto;
}
