import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AdminUsersParamsDto {
  @ApiPropertyOptional({
    description: 'get user with a id',
    example: 'sfj38e8uwqu3ued9',
  })
  @IsString()
  @IsOptional()
  id?: string;
}
