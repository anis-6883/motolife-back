import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
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

export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => !o.isCombo)
  productId: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.isCombo)
  comboProductId: string;

  @IsString()
  @IsOptional()
  variantSku?: string;

  @IsString()
  @IsOptional()
  variation?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  @IsOptional()
  attributes: AttributeDto[];

  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @IsBoolean()
  @IsOptional()
  isCombo: boolean = false;
}
