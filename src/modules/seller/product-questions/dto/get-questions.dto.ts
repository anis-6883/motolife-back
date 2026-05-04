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
  product: string;

  @IsOptional()
  @IsString()
  date: string;
}
