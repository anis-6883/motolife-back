import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class OtpProvider {
  abstract generateOtp(): string;

  abstract sendOtp(phone: string): Promise<string>;

  abstract verifyOtp(decodedOtp: string, submittedOtp: string): boolean;
}
