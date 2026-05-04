import {
  IsNotEmpty,
  IsString,
  IsOptional,
  ValidateNested,
  IsEnum,
  IsEmail,
  ValidateIf,
  IsNumber,
  IsArray,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PAYMENT_METHOD } from 'src/common/enums/orders.enum';
import { AttributeDto } from '../../cart/dto/add-to-cart.dto';

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

export class OrderNowDto {
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => !o.isCombo)
  productId: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.isCombo)
  comboProductId: string;

  @IsString()
  @IsOptional()
  variantSku?: string;

  @IsString()
  @IsOptional()
  variation?: string;

  @IsString()
  @IsOptional()
  thumbnail: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  @IsOptional()
  attributes: AttributeDto[];

  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @IsBoolean()
  @IsOptional()
  isCombo: boolean = false;
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
  @IsOptional()
  cartId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderNowDto)
  @IsOptional()
  items?: OrderNowDto[];

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
  @IsNumber()
  @Type(() => Number)
  deliveryCharge?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  total?: number;

  @IsString()
  @IsOptional()
  couponCode?: string;

  @IsNumber()
  @IsOptional()
  couponDiscount?: number;
}
