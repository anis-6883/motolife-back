import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
  ValidateIf,
  IsBoolean,
} from 'class-validator';

class RefundItemDto {
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => !o.isCombo)
  productId: string;

  @IsString()
  @IsOptional()
  variantSku?: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.isCombo)
  comboProductId: string;

  @IsBoolean()
  @IsOptional()
  isCombo: boolean = false;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

export class RequestRefundDto {
  @IsArray()
  @IsNotEmpty()
  @Type(() => RefundItemDto)
  @ValidateNested({ each: true })
  items: RefundItemDto[];

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  details?: string;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;
}
