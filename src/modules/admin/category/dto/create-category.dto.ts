import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(40)
  name: string;

  @IsString()
  @IsOptional()
  image: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @Matches(/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/, {
    message:
      'Slug must contain only letters (lowercase or uppercase), numbers, and dashes.',
  })
  slug: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }
    return value;
  })
  parent: Types.ObjectId;

  @IsNumber()
  @IsOptional()
  position: number;

  @IsNumber()
  @IsOptional()
  priority: number;

  @IsBoolean()
  @IsOptional()
  status: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateCategoryDto)
  subCategories: CreateCategoryDto[];

  @IsOptional()
  @IsBoolean()
  _uploaded: boolean;
}
