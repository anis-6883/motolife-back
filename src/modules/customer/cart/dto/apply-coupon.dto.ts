import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApplyCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  guestId?: string;
}
