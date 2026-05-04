import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendOtpEmailDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}
