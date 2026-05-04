import { BadRequestException } from '@nestjs/common';

export const STORAGE_ALLOWED_MIME_TYPE_MESSAGE =
  'Only image and video files are allowed';

const STORAGE_ALLOWED_MIME_TYPE_PREFIXES = ['image/', 'video/'] as const;

export const normalizeStorageMimeType = (mimeType: string): string =>
  mimeType.split(';', 1)[0].trim().toLowerCase();

export const isAllowedStorageMimeType = (mimeType?: string): boolean => {
  if (!mimeType) {
    return false;
  }

  const normalizedMimeType = normalizeStorageMimeType(mimeType);

  return STORAGE_ALLOWED_MIME_TYPE_PREFIXES.some((prefix) =>
    normalizedMimeType.startsWith(prefix),
  );
};

export const validateStorageMimeType = (mimeType?: string): string => {
  if (!isAllowedStorageMimeType(mimeType)) {
    throw new BadRequestException(STORAGE_ALLOWED_MIME_TYPE_MESSAGE);
  }

  return normalizeStorageMimeType(mimeType!);
};

export const storageFileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void => {
  if (!isAllowedStorageMimeType(file?.mimetype)) {
    callback(new BadRequestException(STORAGE_ALLOWED_MIME_TYPE_MESSAGE), false);
    return;
  }

  callback(null, true);
};
