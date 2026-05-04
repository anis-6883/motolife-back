import { PartialType } from '@nestjs/mapped-types';
import { CreateHeroBannerDto } from './create-hero-banner.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateHeroBannerDto extends PartialType(CreateHeroBannerDto) {
  @IsOptional()
  @IsBoolean()
  _uploaded?: boolean;
}
