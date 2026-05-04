import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateProductQuestionDto {
  @IsNotEmpty()
  @ValidateIf((o) => !o.comboProduct)
  @Transform(({ value }) => new Types.ObjectId(value))
  product: Types.ObjectId;

  @IsNotEmpty()
  @ValidateIf((o) => !o.product)
  @Transform(({ value }) => new Types.ObjectId(value))
  comboProduct: Types.ObjectId;

  @IsOptional()
  @Transform(({ value }) => new Types.ObjectId(value))
  customer: Types.ObjectId;

  @IsOptional()
  @IsString()
  customerName: string;

  @IsOptional()
  @IsString()
  customerEmail: string;

  @IsOptional()
  @IsBoolean()
  isGuest: boolean;

  @IsNotEmpty()
  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  answer: string;

  @IsOptional()
  @IsBoolean()
  status: boolean;
}
