import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class AttributeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CartItemDto {
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => !o.isCombo)
  productId: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.isCombo)
  comboProductId: string;

  @IsBoolean()
  @IsOptional()
  isCombo: boolean;

  @IsString()
  @IsOptional()
  seller?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  variantSku?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  @IsOptional()
  attributes: AttributeDto[];

  @IsString()
  @IsOptional()
  variation?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsNumber()
  @IsOptional()
  totalPrice?: number;
}

export class CreateCartDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  guestId?: string;

  @IsArray()
  @Type(() => CartItemDto)
  @ValidateNested()
  items: CartItemDto[];

  @IsNumber()
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @IsOptional()
  shippingFee?: number;

  @IsNumber()
  @IsOptional()
  tax?: number;

  @IsNumber()
  @IsOptional()
  total?: number;
}
