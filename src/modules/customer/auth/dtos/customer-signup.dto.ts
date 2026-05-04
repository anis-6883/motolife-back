import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CustomerSignupDto {
  @IsString()
  @MinLength(4)
  @MaxLength(40)
  @Matches(/^(?!\d+$).+$/, {
    message: 'Name cannot consist of only numbers',
  })
  @IsOptional()
  fullName: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;

    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue || undefined;
  })
  @IsEmail()
  @MaxLength(100)
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}
