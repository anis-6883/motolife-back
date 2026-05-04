import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MakeRefundDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  variantSku?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class RejectRefundDto {
  @IsString()
  @IsOptional()
  note?: string;
}
