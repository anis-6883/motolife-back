import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { VerificationOption } from 'src/common/enums/admin.enum';

export class UpdateVendorSettingsDto {
  @IsOptional()
  @IsBoolean()
  minOrderAmountEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  canReplyOnReview?: boolean;

  @IsOptional()
  @IsBoolean()
  canAddComboProduct?: boolean;

  @IsOptional()
  @IsBoolean()
  needNewProductApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  needUpdateProductApproval?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(VerificationOption, { each: true })
  verificationOptions?: VerificationOption[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockThreshold?: number;
}
