import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CustomerSignInDto } from './dtos/customer-signin.dto';
import { CustomerAuthService } from './customer-auth.service';
import { AuthType } from '../../../common/enums/auth-type.enum';
import { Auth } from './decorators/auth.decorator';
import { OtpPayload } from './decorators/otp-payload.decorator';
import { ActiveUser } from './decorators/active-user.decorator';
import * as activeUserInterface from './interfaces/active-user.interface';
import { OtpTokenGuard } from 'src/common/guards/otp-token.guard';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { CustomerSignupDto } from './dtos/customer-signup.dto';
import type { IActiveUser } from './interfaces/active-user.interface';

@Controller()
export class CustomerAuthController {
  constructor(private readonly authService: CustomerAuthService) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  public signIn(@Body() signInDto: CustomerSignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  public sendOtp(@Body() signInDto: CustomerSignInDto) {
    return this.authService.sendOtp(signInDto);
  }

  @Post('send-signup-otp')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  public sendSignupOtp(@Body() signUpDto: Omit<CustomerSignupDto, 'otp'>) {
    return this.authService.sendSignupOtp(signUpDto);
  }

  @Post('send-phone-change-otp')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  public sendPhoneChangeOtp(
    @Body() signUpDto: Pick<CustomerSignupDto, 'phone'>,
  ) {
    return this.authService.sendPhoneChangeOtp(signUpDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  @UseGuards(OtpTokenGuard)
  public verifyOtp(
    @Body() signInDto: CustomerSignInDto,
    @OtpPayload() otpPayload: { phone: string; otp: string },
  ) {
    return this.authService.verifyOtp(signInDto, otpPayload);
  }

  @Post('verify-phone-change-otp')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.Bearer)
  @UseGuards(OtpTokenGuard)
  public verifyPhoneChangeOtp(
    @ActiveUser() user: IActiveUser,
    @Body() updateDto: Pick<CustomerSignupDto, 'phone' | 'otp'>,
    @OtpPayload() otpPayload: { otp: string },
  ) {
    return this.authService.verifyPhoneChangeOtp(user, updateDto, otpPayload);
  }

  @Post('verify-signup-otp')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  @UseGuards(OtpTokenGuard)
  public verifySignupOtp(
    @Body() signUpDto: any,
    @OtpPayload() otpPayload: { otp: string },
  ) {
    return this.authService.verifySignupOtp(signUpDto, otpPayload);
  }

  @Get('/me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthenticationGuard)
  @Auth(AuthType.Bearer)
  public getMe(@ActiveUser() payload: IActiveUser) {
    return this.authService.getMe(payload);
  }
}
