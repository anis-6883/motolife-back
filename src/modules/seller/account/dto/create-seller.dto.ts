import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
  IsNumber,
  IsDateString,
  ValidateIf,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  IdentityType,
  PaymentMethodType,
  SellerAccountStatus,
  SellerVerificationStatus,
} from 'src/common/enums/seller.enums';

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
  bankName: string;

  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  branchName: string;

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
  bankName?: string;

  @ValidateIf((o) => o.methodType === PaymentMethodType.BANK)
  @IsString()
  @IsNotEmpty()
  accountHolderName?: string;

  @ValidateIf((o) => o.methodType === PaymentMethodType.BANK)
  @IsString()
  @IsNotEmpty()
  accountNumber?: string;

  @ValidateIf((o) => o.methodType === PaymentMethodType.BANK)
  @IsString()
  @IsNotEmpty()
  branchName?: string;
}

export class StoreDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?!\d+$).+$/, {
    message: 'Store name cannot consist of only numbers',
  })
  storeName: string;

  @IsString()
  @IsOptional()
  contactNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  storeCategory: string;

  @IsString()
  @IsOptional()
  logoImage: string;

  @IsString()
  @IsOptional()
  coverImage: string;

  @IsString()
  @IsNotEmpty()
  tradeLicenseNumber: string;

  @IsString()
  @IsNotEmpty()
  tradeLicenseImage: string;

  @IsString()
  @IsNotEmpty()
  nidOrPassportNumber: string;

  @IsString()
  @IsNotEmpty()
  nidOrPassportImage: string;

  @IsString()
  tinNumber: string;

  @IsString()
  tinImage: string;

  @IsDateString()
  @IsOptional()
  expiry?: Date;
}

export class BusinessSettingsDto {
  @IsString()
  @IsNotEmpty()
  businessType: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsBoolean()
  @IsOptional()
  isOnVacation?: boolean;

  @IsString()
  @IsOptional()
  vacationDuration?: string;

  @IsString()
  @IsOptional()
  vacationNote?: string;

  @IsNumber()
  @IsOptional()
  minOrderAmount?: number;
}

export class ManagerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(IdentityType)
  @IsOptional()
  identityType?: IdentityType;

  @IsString()
  @IsOptional()
  identityNumber?: string;

  @IsString()
  @IsOptional()
  identityImage?: string;
}

export class CreateSellerDto {
  @IsString()
  @MinLength(4)
  @MaxLength(40)
  @Matches(/^(?!\d+$).+$/, {
    message: 'Full name cannot consist of only numbers',
  })
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(SellerAccountStatus)
  @IsOptional()
  accountStatus: SellerAccountStatus;

  @IsEnum(SellerVerificationStatus)
  @IsOptional()
  verificationStatus: SellerVerificationStatus;

  @IsBoolean()
  @IsOptional()
  showSellerName?: boolean;

  @IsBoolean()
  @IsOptional()
  softDeleted: boolean;

  @ValidateNested()
  @Type(() => StoreDto)
  store: StoreDto;

  @ValidateNested()
  @Type(() => ManagerDto)
  manager: ManagerDto;

  @ValidateNested()
  @Type(() => BusinessSettingsDto)
  businessSettings: BusinessSettingsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentMethodDto)
  paymentMethods: PaymentMethodDto[];

  @IsString()
  @IsNotEmpty()
  password: string;
}
