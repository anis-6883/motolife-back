import {
  Controller,
  Post,
  Body,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import {
  DeleteFileByUrlDto,
  DeleteFileDto,
  GenerateMultiplePresignedUrlsDto,
  GeneratePresignedUrlDto,
} from './dto/presigned-url.dto';
import { apiResponse } from '../utils/api-response';
import { Auth } from 'src/modules/admin/admin-auth/decorators/auth.decorator';
import { AuthType } from '../enums/auth-type.enum';
import { storageFileFilter } from './storage.validation';

@Controller('storage')
@Auth(AuthType.None)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  async generatePresignedUrl(
    @Body() dto: GeneratePresignedUrlDto,
  ): Promise<ReturnType<typeof apiResponse>> {
    const { uploadUrl, fileKey, publicUrl } =
      await this.storageService.generatePresignedUrl(
        dto.folder || 'uploads',
        dto.fileName,
        dto.contentType,
      );

    return apiResponse({
      data: { uploadUrl, fileKey, publicUrl },
      status: true,
      message: 'Successfully generated presigned URL',
    });
  }

  @Post('presigned-urls')
  async generateMultiplePresignedUrls(
    @Body() dto: GenerateMultiplePresignedUrlsDto,
  ): Promise<ReturnType<typeof apiResponse>> {
    const uploads = await Promise.all(
      dto.files.map(async (file) => {
        const { uploadUrl, fileKey, publicUrl } =
          await this.storageService.generatePresignedUrl(
            file.folder || 'uploads',
            file.fileName,
            file.contentType,
          );

        return {
          uploadUrl,
          fileKey,
          publicUrl,
        };
      }),
    );

    return apiResponse({
      data: uploads,
      status: true,
      message: 'Successfully generated presigned URLs',
    });
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: storageFileFilter,
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
  ): Promise<ReturnType<typeof apiResponse>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!folder) {
      throw new BadRequestException('Folder name is required');
    }

    const result = await this.storageService.uploadFile(file, folder);

    return apiResponse({
      data: result,
      status: true,
      message: 'Successfully uploaded file',
    });
  }

  @Post('upload-multiple')
  @UseInterceptors(
    FilesInterceptor('files', 100, {
      fileFilter: storageFileFilter,
    }),
  )
  async uploadFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body('folder') folder: string,
  ): Promise<ReturnType<typeof apiResponse>> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (!folder) {
      throw new BadRequestException('Folder name is required');
    }

    const results = await this.storageService.uploadFiles(files, folder);

    return apiResponse({
      data: results,
      status: true,
      message: 'Successfully uploaded files',
    });
  }

  @Delete('file')
  async deleteFile(
    @Body() dto: DeleteFileDto,
  ): Promise<ReturnType<typeof apiResponse>> {
    await this.storageService.deleteFile(dto.key);
    return apiResponse({
      status: true,
      message: 'Successfully deleted file',
    });
  }

  @Delete('file-url')
  async deleteFileByUrl(
    @Body() dto: DeleteFileByUrlDto,
  ): Promise<ReturnType<typeof apiResponse>> {
    await this.storageService.deleteFileByUrl(dto.url);
    return apiResponse({
      status: true,
      message: 'Successfully deleted file',
    });
  }
}
