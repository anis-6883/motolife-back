import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CustomerAccountStatus } from 'src/common/enums/customer.enums';
import { PaymentMethodType } from 'src/common/enums/seller.enums';

export class BkashPaymentDto {
  @IsEnum(PaymentMethodType)
  methodType: PaymentMethodType.BKASH;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class BankPaymentDto {
  @IsEnum(PaymentMethodType)
  methodType: PaymentMethodType.BANK;

  @IsString()
  @IsNotEmpty()
  cardNumber: string;

  @IsString()
  @IsNotEmpty()
  cardHolderName: string;

  @IsString()
  @IsNotEmpty()
  cvv: string;

  @IsString()
  @IsNotEmpty()
  expiryDate: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class PaymentMethodDto {
  @IsEnum(PaymentMethodType)
  methodType: PaymentMethodType;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ValidateIf((o) => o.methodType === PaymentMethodType.BKASH)
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ValidateIf((o) => o.methodType === PaymentMethodType.BANK)
  @IsString()
  @IsNotEmpty()
  cardNumber?: string;

  @ValidateIf((o) => o.methodType === PaymentMethodType.BANK)
  @IsString()
  @IsNotEmpty()
  cardHolderName?: string;

  @ValidateIf((o) => o.methodType === PaymentMethodType.BANK)
  @IsString()
  @IsNotEmpty()
  cvv?: string;

  @ValidateIf((o) => o.methodType === PaymentMethodType.BANK)
  @IsString()
  @IsNotEmpty()
  expiry?: string;
}

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?!\d+$).+$/, {
    message: 'Title cannot consist of only numbers',
  })
  title: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?!\d+$).+$/, {
    message: 'Address cannot consist of only numbers',
  })
  address: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?!\d+$).+$/, {
    message: 'Thana cannot consist of only numbers',
  })
  thana: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?![\d\s]+$).+$/, {
    message: 'District cannot consist of only numbers or spaces',
  })
  district: string;
}

export class CreateCustomerDto {
  @IsString()
  @MinLength(4)
  @MaxLength(40)
  @Matches(/^(?!\d+$).+$/, {
    message: 'Name cannot consist of only numbers',
  })
  fullName: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;

    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue || undefined;
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses: AddressDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentMethodDto)
  paymentMethods: PaymentMethodDto[];

  @IsBoolean()
  @IsOptional()
  isVerified: boolean;

  @IsEnum(CustomerAccountStatus)
  @IsOptional()
  accountStatus: CustomerAccountStatus;
}
