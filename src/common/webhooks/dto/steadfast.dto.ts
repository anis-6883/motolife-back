import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SteadfastWebhookDto {
  @IsNotEmpty()
  @IsString()
  notification_type: string;

  @IsNotEmpty()
  @IsNumber()
  consignment_id: number;

  @IsNotEmpty()
  @IsString()
  invoice: string;

  @IsOptional()
  @IsString()
  updated_at: string;
}

export class SteadfastDeliveryStatusDto extends SteadfastWebhookDto {
  @IsNotEmpty()
  @IsNumber()
  cod_amount: number;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsOptional()
  @IsNumber()
  delivery_charge: number;

  @IsOptional()
  @IsString()
  tracking_message: string;
}
