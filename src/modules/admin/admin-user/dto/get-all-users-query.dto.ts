import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export class GetAllUsersQueryDto {
  @Type(() => Number)
  @IsOptional()
  page: number;

  @Type(() => Number)
  @IsOptional()
  limit: number;

  @IsOptional()
  search: string;

  @IsOptional()
  @IsEnum(['admin', 'manager'])
  type: string;
}
