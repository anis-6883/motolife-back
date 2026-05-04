import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SellerSignInDto } from './dtos/seller-signin.dto';
import { SellerAuthService } from './seller-auth.service';
import { AuthType } from '../../../common/enums/auth-type.enum';
import { Auth } from './decorators/auth.decorator';
import { OtpPayload } from './decorators/otp-payload.decorator';
import { ActiveUser } from './decorators/active-user.decorator';
import * as activeUserInterface from './interfaces/active-user.interface';
import { OtpTokenGuard } from 'src/common/guards/otp-token.guard';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';

@Controller()
export class SellerAuthController {
  constructor(private readonly authService: SellerAuthService) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  public signIn(@Body() signInDto: Omit<SellerSignInDto, 'otp'>) {
    return this.authService.signIn(signInDto);
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  public sendOtp(@Body() signInDto: Omit<SellerSignInDto, 'password'>) {
    return this.authService.sendOtp(signInDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OtpTokenGuard)
  @Auth(AuthType.None)
  public verifyOtp(
    @Body() signInDto: Omit<SellerSignInDto, 'password'>,
    @OtpPayload() otpPayload: { phone: string; otp: string },
  ) {
    return this.authService.verifyOtp(signInDto, otpPayload);
  }

  @Get('/me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthenticationGuard)
  @Auth(AuthType.Bearer)
  public getMe(@ActiveUser() payload: activeUserInterface.IActiveUser) {
    return this.authService.getMe(payload);
  }

  @Put('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  public forgotPassword(@Body() payload: ForgotPasswordDto) {
    return this.authService.forgotPassword(payload);
  }
}
