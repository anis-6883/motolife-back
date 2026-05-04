import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class RemoveFromCartDto {
  @IsString()
  @IsNotEmpty()
  @ValidateIf((dto) => !dto.isCombo)
  productId: string;

  @IsBoolean()
  @IsOptional()
  isCombo: boolean = false;

  @IsString()
  @IsOptional()
  @ValidateIf((dto) => dto.isCombo)
  comboProductId?: string;

  @IsString()
  @IsOptional()
  variantSku?: string;

  @IsString()
  @IsOptional()
  guestId?: string;
}
