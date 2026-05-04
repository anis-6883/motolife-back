import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum DeliveryType {
  HOME = 0,
  PICKUP = 1,
}

export class PlaceOrderDto {
  @IsNotEmpty()
  @IsString()
  invoice: string;

  @IsNotEmpty()
  @IsString()
  recipient_name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(11)
  @MaxLength(11)
  recipient_phone: string;

  @IsOptional()
  @IsString()
  @MinLength(11)
  @MaxLength(11)
  alternative_phone?: string;

  @IsOptional()
  @IsString()
  recipient_email?: string;

  @IsOptional()
  @IsString()
  recipient_address?: string;

  @IsNotEmpty()
  @IsNumber()
  cod_amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  item_description?: string;

  @IsOptional()
  @IsNumber()
  total_lot?: number;

  @IsOptional()
  @IsEnum(DeliveryType)
  delivery_type?: DeliveryType;
}
