import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

export class BenefitDto {
  @IsString()
  @Matches(/^(?!\d+$).+$/, {
    message: 'Heading cannot consist of only numbers',
  })
  heading: string;

  @IsString()
  @Matches(/^(?!\d+$).+$/, {
    message: 'Text cannot consist of only numbers',
  })
  text: string;
}

export class CreateBenefitsDto {
  @IsString()
  @Matches(/^(?!\d+$).+$/, {
    message: 'Title cannot consist of only numbers',
  })
  title: string;

  @IsArray()
  @Type(() => BenefitDto)
  @ValidateNested()
  benefits: { heading: string; text: string }[];

  @IsBoolean()
  @IsOptional()
  status: boolean;
}
