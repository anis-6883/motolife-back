import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SellerSignInDto {
  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  otp: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
