import { PartialType } from '@nestjs/mapped-types';
import { CreateAnnouncementDto } from './create-announcement.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {
  @IsOptional()
  @IsBoolean()
  _uploaded?: boolean;
}
