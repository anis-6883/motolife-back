import { Injectable } from '@nestjs/common';
import { EmailProvider } from '../providers/email/email.provider';
import { SendOtpEmailDto } from './dto/send-otp-email.dto';

@Injectable()
export class EmailService {
  constructor(private readonly emailProvider: EmailProvider) {}

  async sendOtpEmail(options: SendOtpEmailDto) {
    await this.emailProvider.sendOtpEmail(options);
  }
}
