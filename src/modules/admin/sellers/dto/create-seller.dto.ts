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
  VacationDurationType,
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
  description?: string;

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

  @IsString()
  @IsOptional()
  binNumber: string;

  @IsString()
  @IsOptional()
  binImage: string;

  @IsDateString()
  @IsOptional()
  expiry?: Date;
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

export class VacationSettingsDto {
  @IsBoolean()
  @IsOptional()
  isOnVacation?: boolean;

  @IsEnum(VacationDurationType)
  @IsOptional()
  durationType?: VacationDurationType;

  @IsDateString()
  @IsOptional()
  startAt?: Date;

  @IsDateString()
  @IsOptional()
  endsAt?: Date;

  @IsString()
  @IsOptional()
  note?: string;
}
export class BusinessSettingsDto {
  // @IsString()
  // @IsNotEmpty()
  // businessType: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ValidateNested()
  @Type(() => VacationSettingsDto)
  @IsOptional()
  vacation?: VacationSettingsDto;

  @IsNumber()
  @IsOptional()
  minOrderAmount?: number;
}

export class CreateSellerDto {
  @IsString()
  @MinLength(4)
  @MaxLength(40)
  @Matches(/^(?!\d+$).+$/, {
    message: 'Full name cannot consist of only numbers',
  })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsEnum(SellerAccountStatus)
  @IsOptional()
  accountStatus?: SellerAccountStatus;

  @IsBoolean()
  @IsOptional()
  softDeleted?: boolean;

  @ValidateNested()
  @Type(() => StoreDto)
  store: StoreDto;

  @ValidateNested()
  @Type(() => ManagerDto)
  manager: ManagerDto;

  @ValidateNested()
  @Type(() => BusinessSettingsDto)
  @IsOptional()
  businessSettings?: BusinessSettingsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentMethodDto)
  @IsOptional()
  paymentMethods?: PaymentMethodDto[];

  @IsBoolean()
  @IsOptional()
  showSellerName?: boolean;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsNumber()
  @IsOptional()
  commission?: number;

  @IsNumber()
  @IsOptional()
  gstNumber?: number;

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsEnum(SellerVerificationStatus)
  @IsOptional()
  verificationStatus?: SellerVerificationStatus;
}
