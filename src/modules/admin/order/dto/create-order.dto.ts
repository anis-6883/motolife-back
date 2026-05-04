import {
  IsNotEmpty,
  IsString,
  IsOptional,
  ValidateNested,
  IsEnum,
  IsEmail,
  ValidateIf,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DISCOUNT_TYPE } from 'src/common/enums/products.enum';
import { PAYMENT_METHOD } from 'src/common/enums/orders.enum';

class SpecialDiscountDto {
  @IsNotEmpty()
  @IsEnum(DISCOUNT_TYPE)
  discountType: DISCOUNT_TYPE;

  @IsNotEmpty()
  @IsNumber()
  discountValue: number;

  @IsOptional()
  @IsNumber()
  discountPrice: number;

  @IsOptional()
  @IsString()
  reason: string;
}

class AddressDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  thana: string;

  @IsNotEmpty()
  @IsString()
  district: string;
}

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.guestId)
  userId?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.userId)
  guestId?: string;

  @IsString()
  @IsNotEmpty()
  cartId: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;

  @IsNotEmpty()
  @IsEnum(PAYMENT_METHOD)
  paymentMethod: PAYMENT_METHOD;

  @IsOptional()
  @IsString()
  customerNote?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SpecialDiscountDto)
  specialDiscount: SpecialDiscountDto;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  deliveryCharge?: number;

  @IsOptional()
  @IsString()
  assignedTo?: string;
}
