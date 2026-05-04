import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class GetContactQueryDto {
  @Type(() => Number)
  @IsOptional()
  page: number;

  @Type(() => Number)
  @IsOptional()
  limit: number;

  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  hasReplied: string;

  @IsOptional()
  @IsString()
  sortBy: string;

  @IsOptional()
  @IsString()
  sortOrder: 'asc' | 'desc';
}
