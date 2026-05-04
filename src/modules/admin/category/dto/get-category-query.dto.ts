import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class GetCategoryQueryDto {
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
  @IsBoolean()
  @Transform(({ value }) => value && value === 'true')
  status: string;
}
