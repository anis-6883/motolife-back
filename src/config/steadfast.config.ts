import { registerAs } from '@nestjs/config';

export default registerAs('steadfastConfig', () => ({
  baseUrl: process.env.STEADFAST_BASE_URL,
  apiKey: process.env.STEADFAST_API_KEY,
  apiSecret: process.env.STEADFAST_API_SECRET,
}));
