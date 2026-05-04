import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class RefundQueryDto {
  @IsString()
  @IsOptional()
  status?: string;

  @Type(() => Number)
  @IsOptional()
  page: number;

  @Type(() => Number)
  @IsOptional()
  limit: number;
}
