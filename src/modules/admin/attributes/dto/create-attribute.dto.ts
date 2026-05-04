import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateAttributeDto {
  @IsString()
  @MaxLength(100)
  @Matches(/^(?!\d+$).+$/, {
    message: 'Name cannot consist of only numbers',
  })
  name: string;

  @IsArray()
  @IsString({ each: true })
  values: string[];

  @IsBoolean()
  @IsOptional()
  status: boolean;
}
