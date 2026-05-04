import { Prop } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ShippingZoneType } from 'src/common/enums/admin.enum';

class ShippingCostDto {
  @IsOptional()
  @IsEnum(ShippingZoneType)
  zone?: ShippingZoneType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;
}

export class UpdateShippingSettingsDto {
  @IsOptional()
  @IsArray()
  @IsEnum(ShippingZoneType, { each: true })
  shippingZones?: ShippingZoneType[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingCostDto)
  shippingCosts?: ShippingCostDto[];

  @IsOptional()
  @IsString()
  deliveryTime?: string;

  @IsOptional()
  @IsString()
  shippingTimeText: string;
}
