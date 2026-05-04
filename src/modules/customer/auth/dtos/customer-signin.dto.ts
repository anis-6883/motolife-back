import { IsOptional, IsString } from 'class-validator';

export class CustomerSignInDto {
  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  otp: string;
}
