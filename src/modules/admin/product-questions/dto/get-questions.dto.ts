import { IsOptional, IsString } from 'class-validator';

export class GetProductQuestionQueryDto {
  @IsOptional()
  @IsString()
  page?: string = '1';

  @IsOptional()
  @IsString()
  limit?: string = '10';

  @IsOptional()
  @IsString()
  customer: string;

  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  product: string;

  @IsOptional()
  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  sortBy: string;

  @IsOptional()
  @IsString()
  sortOrder: 'asc' | 'desc';
}
