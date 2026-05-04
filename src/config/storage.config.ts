import { registerAs } from '@nestjs/config';

export default registerAs('s3Config', () => ({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: process.env.AWS_BUCKET_NAME,
  presignedUrlExpiry: parseInt(process.env.AWS_BUCKET_EXPIRE_TIME || '300', 10),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
}));
