import { IsOptional, IsString } from 'class-validator';
import { DisputeStatus } from 'src/common/enums/seller.enums';

export class CreateDisputeDto {
  @IsOptional()
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  mail: string;

  @IsOptional()
  @IsString()
  status: DisputeStatus;
}
