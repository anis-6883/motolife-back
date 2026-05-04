import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class GetOffersQueryDto {
  @Type(() => Number)
  @IsOptional()
  page: number;

  @Type(() => Number)
  @IsOptional()
  limit: number;

  @IsOptional()
  @IsString()
  seller?: string;

  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  resourceType?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  title?: string;
}
