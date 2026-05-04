import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTempDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  key: string;
}
