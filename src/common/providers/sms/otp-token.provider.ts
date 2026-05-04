import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { IOtpTokenPayload } from 'src/common/interfaces/otp-token-payload.interface';
import { decrypt, encrypt } from 'src/common/utils/encryption';

@Injectable()
export class OtpTokenProvider {
  constructor() {}

  public generateOtpToken({ phone, otp }: { phone: string; otp: string }) {
    const ttl = new Date().getTime() + parseInt(process.env.OTP_TOKEN_TTL!, 10);
    const otpToken = encrypt(
      JSON.stringify({
        phone,
        otp,
        ttl,
      }),
    );

    return { otpToken, ttl };
  }

  public verifyOtpToken(token: string): IOtpTokenPayload {
    const decryptRes: string | null = decrypt(token);
    if (!decryptRes) {
      throw new BadRequestException('Invalid OTP');
    }
    const data = JSON.parse(decryptRes) as IOtpTokenPayload;
    if (data.ttl < new Date().getTime())
      throw new BadRequestException('OTP expired');
    return data;
  }
}
