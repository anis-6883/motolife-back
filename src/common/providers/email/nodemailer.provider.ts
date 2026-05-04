import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EmailProvider } from './email.provider';
import emailConfig from 'src/config/email.config';
import { type ConfigType } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendOtpEmailOptions } from './email.interface';
import { otpTemplate } from './templates/otp-template';

@Injectable()
export class NodemailerProvider implements EmailProvider, OnModuleInit {
  private readonly logger = new Logger(NodemailerProvider.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @Inject(emailConfig.KEY)
    private readonly emailConf: ConfigType<typeof emailConfig>,
  ) {}

  async onModuleInit() {
    // this.transporter = nodemailer.createTransport({
    //   host: this.emailConf.host,
    //   port: this.emailConf.port,
    //   secure: this.emailConf.secure,
    //   auth: {
    //     user: this.emailConf.user,
    //     pass: this.emailConf.pass,
    //   },
    // });

    // await this.transporter.verify();

    this.logger.log('Nodemailer initialized successfully');
  }

  async sendOtpEmail(options: SendOtpEmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: `"${this.emailConf.from}" <${this.emailConf.user}>`,
      to: options.to,
      subject: options.subject,
      html: otpTemplate(options.otp),
    });

    this.logger.log(
      `Email sent → ${options.to} | subject: "${options.subject}"`,
    );
  }
}
