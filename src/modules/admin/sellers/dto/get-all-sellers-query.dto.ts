import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  SellerAccountStatus,
  SellerVerificationStatus,
} from 'src/common/enums/seller.enums';

export class GetAllSellersQueryDto {
  @Type(() => Number)
  @IsOptional()
  page: number;

  @Type(() => Number)
  @IsOptional()
  limit: number;

  @IsOptional()
  search: string;

  @IsOptional()
  sortBy: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder: 'asc' | 'desc';

  @IsOptional()
  @IsEnum(SellerVerificationStatus)
  verificationStatus?: string;

  @IsOptional()
  @IsEnum(SellerAccountStatus)
  accountStatus?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
