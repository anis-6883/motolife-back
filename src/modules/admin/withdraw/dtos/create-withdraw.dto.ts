import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { PaymentMethodType } from 'src/common/enums/seller.enums';
import { WITHDRAW_STATUS } from 'src/common/models/withdraw.schema';

export class Dispute {
  @IsString()
  reason: string;

  @IsString()
  subject: string;
}

export class CreateWithdrawDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsEnum(PaymentMethodType)
  @IsOptional()
  paymentMethod: PaymentMethodType;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @ValidateIf((o) => o.paymentMethod === PaymentMethodType.BKASH)
  phone: string;

  @IsString()
  @ValidateIf((o) => o.paymentMethod === PaymentMethodType.BANK)
  accountNumber: string;

  @IsOptional()
  @Type(() => Dispute)
  dispute?: Dispute;

  @IsEnum(WITHDRAW_STATUS)
  @IsOptional()
  status?: WITHDRAW_STATUS;
}
