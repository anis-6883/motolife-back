import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CurrencyPosition, PaymentOption } from 'src/common/enums/admin.enum';
import { SystemType } from 'src/common/models/announcement.schema';

class SupportInfoDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  facebook?: string;
}

export class UpdateGeneralSettingsDto {
  // @IsOptional()
  // @IsBoolean()
  // maintenanceModeEnabled?: boolean;

  @IsOptional()
  @IsDateString()
  maintenanceTimeStart?: string;

  @IsOptional()
  @IsDateString()
  maintenanceTimeEnd?: string;

  @IsOptional()
  @IsString()
  maintenanceMessage?: string;

  @IsOptional()
  @IsEnum(SystemType)
  maintenanceSystem?: SystemType;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(CurrencyPosition)
  currencyPosition?: CurrencyPosition;

  @IsOptional()
  @IsArray()
  @IsEnum(PaymentOption, { each: true })
  paymentOptions?: PaymentOption[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SupportInfoDto)
  support?: SupportInfoDto;
}
