import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateComboBannerDto {
  @IsString()
  @IsNotEmpty()
  image: string;

  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsBoolean()
  @IsOptional()
  status: boolean;

  @IsString()
  @IsOptional()
  url: string;
}
