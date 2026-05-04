import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';

export class CreateStockUnitDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  parentSku: string;

  @IsString()
  @IsOptional()
  variation: string;

  @IsString()
  @IsOptional()
  sku: string;

  @IsBoolean()
  @IsOptional()
  isDamaged: boolean;

  @IsNumber()
  @IsOptional()
  damagePercentage: number;

  @IsString()
  @IsOptional()
  damageDescription: string;

  @IsNumber()
  @IsOptional()
  sellingPrice: number;
}
