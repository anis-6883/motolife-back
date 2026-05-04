import { IsOptional, IsString } from 'class-validator';

export class UpdateRequestDto {
  @IsString()
  @IsOptional()
  note: string;
}
