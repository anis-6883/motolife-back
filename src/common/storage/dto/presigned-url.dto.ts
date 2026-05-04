import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { STORAGE_ALLOWED_MIME_TYPE_MESSAGE } from '../storage.validation';

export class GeneratePresignedUrlDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  folder: string;

  @ApiProperty()
  @IsString()
  fileName: string;

  @ApiProperty()
  @IsString()
  @Matches(/^(image|video)\//i, {
    message: STORAGE_ALLOWED_MIME_TYPE_MESSAGE,
  })
  contentType: string;
}

export class PresignedUrlResponseDto {
  @ApiProperty()
  uploadUrl: string;

  @ApiProperty()
  fileKey: string;

  @ApiProperty()
  publicUrl: string;

  @ApiProperty()
  expiresIn?: number;
}

export class GenerateMultiplePresignedUrlsDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  folder: string;

  @ApiProperty({
    type: [GeneratePresignedUrlDto],
    description: 'Array of file upload requests',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratePresignedUrlDto)
  files: GeneratePresignedUrlDto[];
}

export class DeleteFileDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}

export class DeleteFileByUrlDto {
  @IsString()
  @IsNotEmpty()
  url: string;
}
