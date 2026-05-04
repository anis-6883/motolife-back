import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VacationDurationType } from 'src/common/enums/seller.enums';

export class StoreDto {
  @IsString()
  @IsOptional()
  storeName: string;

  @IsString()
  @IsOptional()
  contactNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsOptional()
  @IsString()
  storeCategory: string;

  @IsString()
  @IsOptional()
  logoImage: string;

  @IsString()
  @IsOptional()
  coverImage: string;

  @IsString()
  @IsOptional()
  tradeLicenseNumber: string;

  @IsString()
  @IsOptional()
  tradeLicenseImage: string;

  @IsString()
  @IsOptional()
  nidOrPassportNumber: string;

  @IsString()
  @IsOptional()
  nidOrPassportImage: string;

  @IsOptional()
  @IsString()
  tinNumber: string;

  @IsOptional()
  @IsString()
  tinImage: string;

  @IsDateString()
  @IsOptional()
  expiry?: Date;
}
export class VacationSettingsDto {
  @IsBoolean()
  @IsOptional()
  isOnVacation?: boolean;

  @IsEnum(VacationDurationType)
  @IsOptional()
  durationType?: VacationDurationType | null;

  @IsString()
  @IsOptional()
  note?: string;

  // startAt / endsAt are calculated server-side — not accepted from client
}

export class BusinessSettingsDto {
  @IsOptional()
  @IsString()
  businessType: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsBoolean()
  @IsOptional()
  isOnVacation?: boolean;

  @IsString()
  @IsOptional()
  vacationNote?: string;

  @IsString()
  @IsOptional()
  vacationDuration?: string;

  @IsNumber()
  @IsOptional()
  minOrderAmount?: number;
  @ValidateNested()
  @Type(() => VacationSettingsDto)
  @IsOptional()
  vacation?: VacationSettingsDto;
}

export class UpdateInhouseDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  image?: string;

  @ValidateNested()
  @Type(() => StoreDto)
  store: StoreDto;

  @ValidateNested()
  @Type(() => BusinessSettingsDto)
  businessSettings: BusinessSettingsDto;

  @IsString()
  @IsOptional()
  password: string;
}
