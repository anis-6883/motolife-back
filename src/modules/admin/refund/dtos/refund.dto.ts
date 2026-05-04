import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { PaymentMethodType } from 'src/common/enums/seller.enums';

export class BkashPaymentDto {
  @IsEnum(PaymentMethodType)
  methodType: PaymentMethodType.BKASH;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  transactionId: string;
}

export class BankPaymentDto {
  @IsEnum(PaymentMethodType)
  methodType: PaymentMethodType.BANK;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  branch: string;
}

export class PaymentMethodDto {
  @IsEnum(PaymentMethodType)
  methodType: PaymentMethodType;

  @ValidateIf((o) => o.methodType === PaymentMethodType.BKASH)
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ValidateIf((o) => o.methodType === PaymentMethodType.BKASH)
  @IsString()
  @IsNotEmpty()
  transactionId?: string;

  @ValidateIf((o) => o.methodType === PaymentMethodType.BANK)
  @IsString()
  @IsNotEmpty()
  accountNumber?: string;

  @ValidateIf((o) => o.methodType === PaymentMethodType.BANK)
  @IsString()
  @IsNotEmpty()
  accountHolderName?: string;

  @ValidateIf((o) => o.methodType === PaymentMethodType.BANK)
  @IsString()
  @IsNotEmpty()
  bankName?: string;

  @ValidateIf((o) => o.methodType === PaymentMethodType.BANK)
  @IsString()
  @IsNotEmpty()
  branch?: string;
}

export class MakeRefundDto {
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => !o.isCombo)
  productId: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.isCombo)
  comboProductId: string;

  @IsBoolean()
  @IsOptional()
  isCombo: boolean = false;

  @IsString()
  @IsOptional()
  variantSku?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsOptional()
  @Type(() => PaymentMethodDto)
  refundMethod: PaymentMethodDto;
}

export class RejectRefundDto {
  @IsString()
  @IsOptional()
  note?: string;
}
