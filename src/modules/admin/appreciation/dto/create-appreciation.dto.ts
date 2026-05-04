import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateAppreciationDto {
  @IsNotEmpty()
  @Transform(({ value }) => new Types.ObjectId(value))
  seller: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}
