import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Request } from 'express';
import authConfiguration from 'src/config/auth.config';
import { OtpTokenProvider } from '../providers/sms/otp-token.provider';
import { OTP_KEY } from '../constants/auth.constants';

@Injectable()
export class OtpTokenGuard implements CanActivate {
  constructor(
    private readonly otpTokenProvider: OtpTokenProvider,

    @Inject(authConfiguration.KEY)
    private readonly authConfig: ConfigType<typeof authConfiguration>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);

    try {
      const payload = this.otpTokenProvider.verifyOtpToken(token);

      request[OTP_KEY] = payload;
    } catch (error) {
      throw error;
    }

    return true;
  }

  private extractTokenFromRequest(req: Request): string {
    const token =
      req.cookies?.[this.authConfig.otpTokenKey] ||
      req.headers[this.authConfig.otpTokenKey.toLowerCase()] ||
      req.query?.[this.authConfig.otpTokenKey.toLowerCase()];

    if (!token) {
      throw new BadRequestException('Invalid token ');
    }

    return token as string;
  }
}
