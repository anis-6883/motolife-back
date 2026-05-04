import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
  HttpException,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import s3Configurations from '../../config/storage.config';
import { PresignedUrlResponseDto } from './dto/presigned-url.dto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { InjectModel } from '@nestjs/mongoose';
import { Temp } from '../models/temp.schema';
import { type PaginateModel } from 'mongoose';
import { validateStorageMimeType } from './storage.validation';

export interface UploadResult {
  fileKey: string;
  publicUrl: string;
}

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(StorageService.name);
  private readonly presignedUrlExpiry: number;

  constructor(
    @Inject(s3Configurations.KEY)
    private readonly s3Config: ConfigType<typeof s3Configurations>,
    @InjectModel(Temp.name)
    private readonly tempModel: PaginateModel<Temp>,
  ) {
    this.s3Client = new S3Client({
      region: this.s3Config.region,
      credentials: {
        accessKeyId: this.s3Config.accessKeyId!,
        secretAccessKey: this.s3Config.secretAccessKey!,
      },
    });
    this.bucketName = this.s3Config.bucket!;
    this.presignedUrlExpiry = this.s3Config.presignedUrlExpiry;
  }

  async generatePresignedUrl(
    folder: string,
    fileName: string,
    contentType: string,
  ): Promise<PresignedUrlResponseDto> {
    const validatedContentType = validateStorageMimeType(contentType);

    try {
      const fileKey = this.generateFileKey(folder, fileName);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        ContentType: validatedContentType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.presignedUrlExpiry,
      });

      const publicUrl = this.getPublicUrl(fileKey);

      return { uploadUrl, fileKey, publicUrl };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Failed to generate presigned URL: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not generate upload URL');
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    const validatedMimeType = validateStorageMimeType(file.mimetype);

    try {
      const fileKey = this.generateFileKey(folder, file.originalname);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentType: validatedMimeType,
      });

      await this.s3Client.send(command);

      const publicUrl = this.getPublicUrl(fileKey);

      this.logger.log(`Successfully uploaded file: ${fileKey}`);

      // await this.tempModel.create({
      //   url: publicUrl,
      //   key: fileKey,
      // });

      return { fileKey, publicUrl };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Could not upload file to S3');
    }
  }

  async uploadFiles(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<UploadResult[]> {
    try {
      const uploadPromises = files.map((file) => this.uploadFile(file, folder));
      return await Promise.all(uploadPromises);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Failed to upload files: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not upload files to S3');
    }
  }

  async deleteFileByUrl(publicUrl: string): Promise<void> {
    try {
      const urlParts = new URL(publicUrl);
      const key = urlParts.pathname.substring(1);

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      this.logger.log(`Successfully deleted file: ${key}`);
    } catch (err) {
      this.logger.error(`Failed to delete ${publicUrl} from S3`);
    }
  }

  async deleteFilesByUrls(publicUrls: string[]): Promise<void> {
    try {
      let fileKeys: string[] = [];
      publicUrls.forEach((publicUrl) => {
        const urlParts = new URL(publicUrl);
        const key = urlParts.pathname.substring(1);
        fileKeys.push(key);
      });

      if (!fileKeys || fileKeys.length === 0) {
        return;
      }

      const command = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: fileKeys.map((key) => ({ Key: key })),
          Quiet: true,
        },
      });

      const result = await this.s3Client.send(command);
      this.logger.log(`Deleted ${fileKeys.length} files from S3`);

      if (result.Errors && result.Errors.length > 0) {
        this.logger.warn(
          `Some files failed to delete: ${JSON.stringify(result.Errors)}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete files: ${error.message}`,
        error.stack,
      );
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`Successfully deleted file: ${key}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file ${key}: ${error.message}`,
        error.stack,
      );
    }
  }

  async deleteFiles(fileKeys: string[]): Promise<void> {
    if (!fileKeys || fileKeys.length === 0) {
      return;
    }

    const command = new DeleteObjectsCommand({
      Bucket: this.bucketName,
      Delete: {
        Objects: fileKeys.map((key) => ({ Key: key })),
        Quiet: true,
      },
    });

    try {
      const result = await this.s3Client.send(command);
      this.logger.log(`Deleted ${fileKeys.length} files from S3`);

      if (result.Errors && result.Errors.length > 0) {
        this.logger.warn(
          `Some files failed to delete: ${JSON.stringify(result.Errors)}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete files: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private generateFileKey(folderName: string, fileName: string): string {
    const uuid = uuidv4();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

    return `${folderName}/${uuid}`;
  }

  private getPublicUrl(fileKey: string): string {
    const region = this.s3Config.region;
    return `https://${this.bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
  }

  extractFileKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.startsWith('/') ? pathname.slice(1) : pathname;
    } catch {
      return null;
    }
  }
}
