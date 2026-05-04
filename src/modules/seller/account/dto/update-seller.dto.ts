import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
  BusinessSettingsDto,
  CreateSellerDto,
  StoreDto,
} from './create-seller.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStoreDto extends PartialType(StoreDto) {}

export class UpdateBusinessSettingsDto extends PartialType(
  BusinessSettingsDto,
) {}

export class UpdateSellerDto extends PartialType(
  OmitType(CreateSellerDto, ['store', 'businessSettings'] as const),
) {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateStoreDto)
  store?: UpdateStoreDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateBusinessSettingsDto)
  businessSettings?: UpdateBusinessSettingsDto;
}
