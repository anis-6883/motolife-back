import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import {
  AttributeDto,
  CreateProductDto,
  SizeGuideDto,
  VariantDto,
} from './create-products.dto';

export class UpdateSizeGuideDto extends PartialType(SizeGuideDto) {}

export class UpdateVariantDto extends PartialType(VariantDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  attributes?: AttributeDto[];
}

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['sizeGuide', 'variants'] as const),
) {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSizeGuideDto)
  sizeGuide?: UpdateSizeGuideDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantDto)
  variants?: UpdateVariantDto[];
}
