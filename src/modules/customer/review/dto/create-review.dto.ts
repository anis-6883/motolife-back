import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateReviewDto {
  @IsNotEmpty()
  @ValidateIf((o) => !o.comboProductId)
  @Transform(({ value }) => new Types.ObjectId(value))
  productId: Types.ObjectId;

  @IsNotEmpty()
  @ValidateIf((o) => !o.productId)
  @Transform(({ value }) => new Types.ObjectId(value))
  comboProductId: Types.ObjectId;

  @IsOptional()
  @Transform(({ value }) => new Types.ObjectId(value))
  customerId: Types.ObjectId;

  @IsOptional()
  @Transform(({ value }) => new Types.ObjectId(value))
  sellerId: Types.ObjectId;

  @IsOptional()
  @IsString()
  customerName: string;

  @IsOptional()
  @IsArray()
  images: string[];

  @IsOptional()
  @IsString()
  customerPhone: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous: boolean;

  @IsNotEmpty()
  @IsNumber()
  rating: number;

  @IsOptional()
  @IsString()
  review: string;

  @IsOptional()
  @IsString()
  reply: string;

  @IsOptional()
  @IsBoolean()
  willPublish: boolean;
}
