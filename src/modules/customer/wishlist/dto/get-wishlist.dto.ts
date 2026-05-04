import { IsOptional, IsString } from 'class-validator';

export class GetWishListQueryDto {
  @IsOptional()
  @IsString()
  page?: string = '1';

  @IsOptional()
  @IsString()
  limit?: string = '10';
}
