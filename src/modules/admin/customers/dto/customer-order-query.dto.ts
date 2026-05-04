import { IsOptional, IsString } from 'class-validator';

export class CustomerOrdersQueryDto {
  @IsOptional()
  @IsString()
  page?: string = '1';

  @IsOptional()
  @IsString()
  limit?: string = '10';

  @IsOptional()
  @IsString()
  search?: string;
}
