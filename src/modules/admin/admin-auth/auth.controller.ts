import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { AdminSignInDto } from './dtos/admin-signin.dto';
import { AdminAuthService } from './auth.service';
import { AuthType } from '../../../common/enums/auth-type.enum';
import { Auth } from './decorators/auth.decorator';
import { OtpPayload } from './decorators/otp-payload.decorator';
import { ActiveUser } from './decorators/active-user.decorator';
import * as activeUserInterface from './interfaces/active-user.interface';
import { OtpTokenGuard } from 'src/common/guards/otp-token.guard';
import { UpdateAdminUserDto } from '../admin-user/dto/update-admin.dto';
import { ChangeAdminPasswordDto } from './dtos/change-password.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AdminAuthService) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  public signIn(@Body() signInDto: AdminSignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.Bearer)
  public changePassword(
    @Body() payload: ChangeAdminPasswordDto,
    @ActiveUser() activeUser: activeUserInterface.IActiveUser,
  ) {
    return this.authService.changePassword(payload, activeUser);
  }

  @Put('profile')
  @Auth(AuthType.Bearer)
  update(
    @Body() updateUserDto: UpdateAdminUserDto,
    @ActiveUser() activeUser: activeUserInterface.IActiveUser,
  ) {
    return this.authService.update(activeUser, updateUserDto);
  }

  // @Post('send-otp')
  // @HttpCode(HttpStatus.OK)
  // @Auth(AuthType.None)
  // public sendOtp(@Body() signInDto: AdminSignInDto) {
  //   return this.authService.sendOtp(signInDto);
  // }

  // @Post('verify-otp')
  // @HttpCode(HttpStatus.OK)
  // @Auth(AuthType.None)
  // @UseGuards(OtpTokenGuard)
  // public verifyOtp(
  //   @Body() signInDto: AdminSignInDto,
  //   @OtpPayload() otpPayload: { phone: string; otp: string },
  // ) {
  //   return this.authService.verifyOtp(signInDto, otpPayload);
  // }

  @Get('/me')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.Bearer)
  public getMe(@ActiveUser() payload: activeUserInterface.IActiveUser) {
    return this.authService.getMe(payload);
  }
}
