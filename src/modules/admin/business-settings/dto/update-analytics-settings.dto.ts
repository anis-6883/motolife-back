import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAnalyticsSettingsDto {
  @IsOptional()
  @IsBoolean()
  googleSearchConsoleEnabled?: boolean;

  @IsOptional()
  @IsString()
  googleSearchConsoleVerificationId?: string;

  @IsOptional()
  @IsBoolean()
  googleAnalyticsEnabled?: boolean;

  @IsOptional()
  @IsString()
  googleAnalyticsId?: string;

  @IsOptional()
  @IsBoolean()
  facebookPixelEnabled?: boolean;

  @IsOptional()
  @IsString()
  facebookPixelId?: string;

  @IsOptional()
  @IsBoolean()
  twitterPixelEnabled?: boolean;

  @IsOptional()
  @IsString()
  twitterPixelId?: string;
}
