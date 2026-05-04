import { IsNotEmpty, IsString } from 'class-validator';

export class GetVideoTitleDto {
  @IsString()
  @IsNotEmpty()
  videoId: string;
}
