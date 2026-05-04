import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateAdminUserDto {
  @IsString()
  @MinLength(4)
  @MaxLength(40)
  @Matches(/^(?!\d+$).+$/, {
    message: 'Name cannot consist of only numbers',
  })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  image: string;

  @IsString()
  @IsNotEmpty()
  @Type(() => Types.ObjectId)
  role: Types.ObjectId;

  @IsString()
  @IsOptional()
  @IsEnum(['admin', 'manager'])
  type: string;

  @IsString()
  @IsEnum(['passport', 'nid'])
  @IsOptional()
  identifyType: string;

  @IsString()
  @IsOptional()
  identifyImage: string;

  @IsString()
  @IsOptional()
  identifyNumber: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsBoolean()
  @IsOptional()
  status: boolean;
}
