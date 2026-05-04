import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, Min } from 'class-validator';

export class GetAttributesQueryDto {
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

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value && value === 'true')
  status: string | boolean;

  @IsOptional()
  @IsEnum(['true', 'false'])
  p: string;
}
