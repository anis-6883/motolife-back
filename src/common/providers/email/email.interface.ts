export interface SendOtpEmailOptions {
  to: string | string[];
  subject: string;
  otp: string;
}
