import { Body, Controller, Get, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendOtpEmailDto } from './dto/send-otp-email.dto';
import { Auth } from 'src/modules/admin/admin-auth/decorators/auth.decorator';
import { AuthType } from '../enums/auth-type.enum';

@Controller('email')
@Auth(AuthType.None)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async sendEmail(@Body() dto: SendOtpEmailDto) {
    await this.emailService.sendOtpEmail(dto);
  }
}
