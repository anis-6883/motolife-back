import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHeroBannerDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  image: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  bgColor?: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
