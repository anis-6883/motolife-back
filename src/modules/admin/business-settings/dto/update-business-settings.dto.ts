import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { UpdateGeneralSettingsDto } from './update-general-settings.dto';
import { UpdateVendorSettingsDto } from './update-vendor-settings.dto';
import { UpdateCustomerSettingsDto } from './update-customer-settings.dto';
import { UpdateOrderSettingsDto } from './update-order-settings.dto';
import { UpdateWithdrawMethodsDto } from './update-withdraw-methods.dto';
import { UpdateShippingSettingsDto } from './update-shipping-settings.dto';
import { UpdateAnalyticsSettingsDto } from './update-analytics-settings.dto';

export class UpdateBusinessSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateGeneralSettingsDto)
  general?: UpdateGeneralSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateVendorSettingsDto)
  vendor?: UpdateVendorSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCustomerSettingsDto)
  customer?: UpdateCustomerSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateOrderSettingsDto)
  order?: UpdateOrderSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateWithdrawMethodsDto)
  withdrawMethods?: UpdateWithdrawMethodsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateShippingSettingsDto)
  shipping?: UpdateShippingSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAnalyticsSettingsDto)
  analytics?: UpdateAnalyticsSettingsDto;
}
