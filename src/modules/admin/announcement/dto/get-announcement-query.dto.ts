import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class GetAnnouncementsQueryDto {
  @Type(() => Number)
  @IsOptional()
  page: number;

  @Type(() => Number)
  @IsOptional()
  limit: number;

  @IsOptional()
  search: string;
}
