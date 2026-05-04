import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @MaxLength(100)
  @Matches(/^(?!\d+$).+$/, {
    message: 'Name cannot consist of only numbers',
  })
  name: string;

  @IsBoolean()
  @IsOptional()
  status: boolean;

  @IsString()
  @IsOptional()
  image: string;
}
