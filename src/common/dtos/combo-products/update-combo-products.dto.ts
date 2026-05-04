import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import {
  CreateComboProductDto,
  SizeGuideDto,
} from './create-combo-products.dto';

export class UpdateSizeGuideDto extends PartialType(SizeGuideDto) {}

export class UpdateComboProductDto extends PartialType(
  OmitType(CreateComboProductDto, ['sizeGuide'] as const),
) {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSizeGuideDto)
  sizeGuide?: UpdateSizeGuideDto;
}
