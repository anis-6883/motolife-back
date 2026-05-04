import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { CustomerAccountStatus } from 'src/common/enums/customer.enums';

export class GetAllCustomersQueryDto {
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
  @IsEnum(CustomerAccountStatus)
  accountStatus?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
