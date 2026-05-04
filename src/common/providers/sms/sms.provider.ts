import { Inject, Injectable } from '@nestjs/common';
import { OtpProvider } from './otp.provider';
import appConfiguration from 'src/config/app.config';
import type { ConfigType } from '@nestjs/config';

@Injectable()
export class SmsProvider implements OtpProvider {
  constructor(
    @Inject(appConfiguration.KEY)
    private readonly appConfig: ConfigType<typeof appConfiguration>,
  ) {}

  generateOtp(): string {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    return code.toString();
  }

  sendOtp(phone: string): Promise<string> {
    const otp = this.generateOtp();
    return Promise.resolve(otp);
  }

  verifyOtp(decodedOtp: string, submittedOtp: string): boolean {
    if (
      submittedOtp === decodedOtp ||
      this.appConfig.environment === 'development'
    ) {
      return true;
    }
    return false;
  }
}
