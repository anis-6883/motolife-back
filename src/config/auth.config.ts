import { registerAs } from '@nestjs/config';

export default registerAs('authConfig', () => ({
  secret: process.env.JWT_SECRET || 'secret',
  audience: process.env.JWT_TOKEN_AUDIENCE || 'audience',
  issuer: process.env.JWT_TOKEN_ISSUER || 'issuer',
  accessTokenTtl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL ?? '3600', 10),
  refreshTokenTtl: parseInt(process.env.JWT_REFRESH_TOKEN_TTL ?? '86400', 10),
  otpTokenTtl: parseInt(process.env.OTP_TOKEN_TTL ?? '300', 10),
  otpTokenKey: process.env.OTP_TOKEN_KEY || 'otp',
  guestCookieTtlMs: parseInt(
    process.env.GUEST_COOKIE_TTL_MS ?? '2592000000',
    10,
  ),
  gidCookie: process.env.GID_COOKIE || 'gid',
  productionDomain: process.env.PRODUCTION_DOMAIN || 'rootdevs.xyz',
}));
