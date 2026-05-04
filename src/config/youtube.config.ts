import { registerAs } from '@nestjs/config';

export default registerAs('youtubeConfig', () => ({
  apiKey: process.env.YOUTUBE_DATA_API_KEY,
}));
