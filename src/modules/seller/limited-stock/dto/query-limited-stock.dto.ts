import {
  IsBooleanString,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
} from 'class-validator';

export class QueryLimitedStockDto {
  @IsNotEmpty()
  @IsNumberString()
  page: string;

  @IsNotEmpty()
  @IsNumberString()
  limit: string;

  @IsOptional()
  @IsBooleanString()
  isPublished?: string;
}
