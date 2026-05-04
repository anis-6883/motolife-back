import { registerAs } from '@nestjs/config';

export default registerAs('paymentConfig', () => ({
  sslcommerz: {
    storeId: process.env.SSLCOMMERZ_STORE_ID,
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD,
    baseUrl: process.env.SSLCOMMERZ_BASE_URL,
  },
}));
