import { registerAs } from '@nestjs/config';

export default registerAs('databaseConfig', () => ({
  databaseUrl: process.env.DATABASE_URL,
}));
