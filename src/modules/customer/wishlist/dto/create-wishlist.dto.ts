import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Types } from 'mongoose';

export enum WishlistType {
  PRODUCT = 'product',
  COMBO = 'combo',
}
export class CreateWishlistDto {
  @IsNotEmpty()
  @ValidateIf((o) => !o.comboProduct)
  @Transform(({ value }) => new Types.ObjectId(value))
  product: Types.ObjectId;

  @IsNotEmpty()
  @ValidateIf((o) => !o.product)
  @Transform(({ value }) => new Types.ObjectId(value))
  comboProduct: Types.ObjectId;

  @IsOptional()
  @IsEnum(WishlistType)
  type?: WishlistType;

  @IsOptional()
  @Transform(({ value }) => new Types.ObjectId(value))
  customer: Types.ObjectId;

  @IsOptional()
  @IsString()
  variantSku: string;
}
