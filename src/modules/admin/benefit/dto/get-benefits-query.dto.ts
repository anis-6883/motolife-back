import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class GetBenefitsQueryDto {
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
  @IsEnum(['true', 'false'])
  status: string;

  @IsOptional()
  @IsEnum(['true', 'false'])
  p: string;
}
