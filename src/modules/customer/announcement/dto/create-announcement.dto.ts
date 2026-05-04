import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  AnnouncementType,
  DisplayStyle,
  SystemType,
} from 'src/common/models/announcement.schema';

export class CreateAnnouncementDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsEnum(AnnouncementType)
  type: AnnouncementType;

  @IsNotEmpty()
  @IsEnum(DisplayStyle)
  displayStyle: DisplayStyle;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsOptional()
  @IsEnum(SystemType)
  selectedSystem: SystemType;

  @IsOptional()
  @IsBoolean()
  status: boolean;
}
