import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateCartItemDto {
  @IsString()
  @IsNotEmpty()
  @ValidateIf((dto) => !dto.isCombo)
  productId: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((dto) => dto.isCombo)
  comboProductId: string;

  @IsBoolean()
  @IsOptional()
  isCombo: boolean = false;

  @IsString()
  @IsOptional()
  variantSku?: string;

  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}
