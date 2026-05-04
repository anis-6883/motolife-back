import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminSignInDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
