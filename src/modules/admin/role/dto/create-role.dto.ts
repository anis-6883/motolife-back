import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { PERMISSIONS } from '../constants/permissions.constants';

export class CreateRoleDto {
  @IsString()
  @MinLength(4)
  @MaxLength(40)
  @Matches(/^(?!\d+$).+$/, {
    message: 'Name cannot consist of only numbers',
  })
  name: string;

  @IsArray()
  @IsNotEmpty()
  @IsEnum(PERMISSIONS, { each: true })
  permissions: PERMISSIONS[];

  @IsBoolean()
  @IsOptional()
  status: boolean;
}
