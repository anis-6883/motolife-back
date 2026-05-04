import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { Types } from 'mongoose';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

class UpdateSubCategoryDto extends PartialType(CreateCategoryDto) {
  @IsOptional()
  @Transform(({ value }) => new Types.ObjectId(value))
  _id?: Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  _delete?: boolean;
}

export class UpdateCategoryDto extends OmitType(
  PartialType(CreateCategoryDto),
  ['subCategories'] as const,
) {
  @IsOptional()
  @Transform(({ value }) => new Types.ObjectId(value))
  _id?: Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  _delete?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateSubCategoryDto)
  subCategories?: UpdateSubCategoryDto[];
}
