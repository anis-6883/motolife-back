import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class Policy {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  description: string;
}

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  tagline: string;

  @IsString()
  @IsOptional()
  logo: string;

  @IsString()
  @IsOptional()
  favIcon: string;

  @IsString()
  @IsOptional()
  openGraphImage: string;

  @IsString()
  @IsOptional()
  openGraphTitle: string;

  @IsString()
  @IsOptional()
  openGraphDescription: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Policy)
  policies: Policy[];

  @IsBoolean()
  @IsOptional()
  enableCustomerOtpLogin: boolean;

  @IsBoolean()
  @IsOptional()
  enableCustomerPasswordLogin: boolean;

  @IsBoolean()
  @IsOptional()
  enableSellerOtpLogin: boolean;

  @IsBoolean()
  @IsOptional()
  enableSellerPasswordLogin: boolean;

  @IsBoolean()
  @IsOptional()
  sellerApprovalRequired: boolean;

  @IsNumber()
  @IsOptional()
  maxOtpHits: number;

  @IsNumber()
  @IsOptional()
  otpResendTime: number;

  @IsNumber()
  @IsOptional()
  otpBlockTime: number;

  @IsNumber()
  @IsOptional()
  maxLoginHits: number;

  @IsNumber()
  @IsOptional()
  loginBlockTime: number;
}
