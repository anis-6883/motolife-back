import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { BannerType } from 'src/common/models/banner.schema';

export class GetBannersQueryDto {
  @Type(() => Number)
  @IsOptional()
  page: number;

  @Type(() => Number)
  @IsOptional()
  limit: number;

  @IsOptional()
  @IsEnum(BannerType)
  type: BannerType;
}
