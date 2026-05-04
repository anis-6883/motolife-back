import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ActivityAction } from 'src/common/enums/admin.enum';

export class GetActivityQueryDto {
  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  resourceType?: string;

  @IsString()
  @IsOptional()
  resourceId?: string;

  @IsEnum(ActivityAction)
  @IsOptional()
  action?: ActivityAction;
}
