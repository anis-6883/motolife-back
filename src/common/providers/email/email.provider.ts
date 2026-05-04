import { Injectable } from '@nestjs/common';
import { SendOtpEmailOptions } from './email.interface';

@Injectable()
export abstract class EmailProvider {
  abstract sendOtpEmail(options: SendOtpEmailOptions): Promise<void>;
}
