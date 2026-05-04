import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateReviewDto {
  @IsOptional()
  @IsNumber()
  rating: number;

  @IsOptional()
  @IsString()
  review: string;

  @IsOptional()
  @IsString()
  reply: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => new Types.ObjectId(value))
  replyBy: Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  willPublish: boolean;

  @IsOptional()
  @IsBoolean()
  softDeleted: boolean;
}
