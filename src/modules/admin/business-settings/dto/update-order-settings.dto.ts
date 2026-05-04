import { IsBoolean, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { DeliveryResponsibility } from 'src/common/enums/admin.enum';

export class UpdateOrderSettingsDto {
  @IsOptional()
  @IsBoolean()
  guestCheckoutEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  showVatOrTax?: boolean;

  @IsOptional()
  @IsBoolean()
  isFreeDeliveryEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freeDeliveryThreshold?: number;

  @IsOptional()
  @IsEnum(DeliveryResponsibility)
  freeDeliveryResponsibility?: DeliveryResponsibility;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxRefundableDays?: number;
}
