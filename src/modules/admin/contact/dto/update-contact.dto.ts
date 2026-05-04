import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DisputeStatus } from 'src/common/enums/seller.enums';

export class ReplyDto {
  @IsOptional()
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  replyBy: 'admin' | 'seller';
}

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsBoolean()
  seen: boolean;

  @IsOptional()
  @Type(() => ReplyDto)
  @ValidateNested()
  replies: ReplyDto[];

  @IsOptional()
  @IsBoolean()
  softDeleted: boolean;
}
