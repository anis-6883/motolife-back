import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  IsMongoId,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import {
  CouponType,
  CouponBearer,
  ProductType,
} from 'src/common/models/coupon.schema';
import { DISCOUNT_TYPE } from 'src/common/enums/products.enum';
import { Types } from 'mongoose';
import { Transform } from 'class-transformer';

export class CreateCouponDto {
  @IsEnum(CouponType)
  @IsNotEmpty()
  type: CouponType;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNotEmpty()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(CouponBearer)
  bearer?: CouponBearer;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((id: string) => new Types.ObjectId(id))
      : value,
  )
  sellers?: Types.ObjectId[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((id: string) => new Types.ObjectId(id))
      : value,
  )
  customers?: Types.ObjectId[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((id: string) => new Types.ObjectId(id))
      : value,
  )
  products?: Types.ObjectId[];

  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellerThreshold?: number;

  @ValidateIf((o) => o.type !== CouponType.FREE_DELIVERY)
  @IsNotEmpty()
  @IsEnum(DISCOUNT_TYPE)
  discountType?: DISCOUNT_TYPE;

  @ValidateIf((o) => o.type !== CouponType.FREE_DELIVERY)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  pointsRequired?: number;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
