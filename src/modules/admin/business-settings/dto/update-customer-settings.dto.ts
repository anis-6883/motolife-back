import { IsBoolean, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { UsablePlace } from 'src/common/enums/admin.enum';

export class UpdateCustomerSettingsDto {
  @IsOptional()
  @IsBoolean()
  isBonusPointsEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchaseAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  earnedPoints?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pointValue?: number;

  @IsOptional()
  @IsEnum(UsablePlace)
  usablePlace?: UsablePlace;
}
