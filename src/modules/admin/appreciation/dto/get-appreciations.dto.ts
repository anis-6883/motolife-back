import { IsOptional, IsString } from 'class-validator';

export class GetAppreciationQueryDto {
  @IsOptional()
  @IsString()
  page?: string = '1';

  @IsOptional()
  @IsString()
  limit?: string = '10';
}
