import { IsNotEmpty, IsString } from 'class-validator';

export class ChangeAdminPasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
