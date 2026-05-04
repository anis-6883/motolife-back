import { Type } from 'class-transformer';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class FlashSalesQueryDto {
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @Type(() => Number)
  @IsOptional()
  page: number;

  @Type(() => Number)
  @IsOptional()
  limit: number;
}
