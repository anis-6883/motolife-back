import { IsOptional, IsString } from 'class-validator';

export class CustomerParamsDto {
  @IsString()
  @IsOptional()
  id?: string;
}
