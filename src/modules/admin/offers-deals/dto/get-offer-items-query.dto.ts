import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class GetOfferItemsQueryDto {
  @Type(() => Number)
  @IsOptional()
  page: number;

  @Type(() => Number)
  @IsOptional()
  limit: number;

  @IsOptional()
  search: string;
}
