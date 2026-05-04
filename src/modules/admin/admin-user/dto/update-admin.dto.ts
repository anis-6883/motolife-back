import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminUserDto } from './create-admin.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAdminUserDto extends PartialType(CreateAdminUserDto) {
  @IsBoolean()
  @IsOptional()
  _uploaded: boolean;
}
