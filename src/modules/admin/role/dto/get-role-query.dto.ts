import { Type } from 'class-transformer';
import { IsOptional, IsString, Min } from 'class-validator';

export class GetRolesQueryDto {
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  page: number;

  @Type(() => Number)
  @IsOptional()
  limit: number;

  @IsOptional()
  @IsString()
  search: string;
}
