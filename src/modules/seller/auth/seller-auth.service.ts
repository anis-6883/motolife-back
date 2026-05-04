import { ForbiddenException, Injectable } from '@nestjs/common';
import { SellerSignInDto } from './dtos/seller-signin.dto';
import { GenerateTokenProvider } from './providers/generate-token.provider';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OtpProvider } from '../../../common/providers/sms/otp.provider';
import { OtpTokenProvider } from 'src/common/providers/sms/otp-token.provider';
import { IActiveUser } from './interfaces/active-user.interface';
import { apiResponse } from 'src/common/utils/api-response';
import { Seller } from 'src/common/models/seller.schema';
import {
  SellerAccountStatus,
  SellerVerificationStatus,
} from 'src/common/enums/seller.enums';
import { HashingProvider } from 'src/modules/admin/admin-auth/providers/hashing.provider';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';

@Injectable()
export class SellerAuthService {
  constructor(
    @InjectModel(Seller.name)
    private readonly userModel: Model<Seller>,
    private readonly generateTokenProvider: GenerateTokenProvider,
    private readonly otpProvider: OtpProvider,
    private readonly otpTokenProvider: OtpTokenProvider,
    private readonly hashingProvider: HashingProvider,
  ) {}

  public async signIn(signInDto: Omit<SellerSignInDto, 'otp'>) {
    const user = await this.userModel
      .findOne({ email: signInDto.email })
      .select('+password');

    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }

    const isPasswordValid = await this.hashingProvider.comparePasswords(
      signInDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new ForbiddenException('Invalid credentials');
    }

    const data = await this.generateTokenProvider.generateTokens(user);
    return apiResponse({ data, message: 'Seller sign in successfully' });
  }

  public async sendOtp(signInDto: Omit<SellerSignInDto, 'password'>) {
    const user = await this.userModel.findOne({ phone: signInDto.phone });

    if (!user) {
      throw new ForbiddenException('Invalid phone number');
    }

    const otp = await this.otpProvider.sendOtp(user.phone);
    const data = this.otpTokenProvider.generateOtpToken({
      phone: user.phone,
      otp,
    });

    return apiResponse({
      data: data,
      message: 'OTP sent successfully',
    });
  }

  public async verifyOtp(
    signInDto: Omit<SellerSignInDto, 'password'>,
    otpPayload: { phone: string; otp: string },
  ) {
    const user = await this.userModel.findOne({ phone: otpPayload.phone });

    if (!user) {
      throw new ForbiddenException('Invalid phone number');
    }
    const isOtpValid = this.otpProvider.verifyOtp(
      otpPayload.otp,
      signInDto.otp,
    );

    if (!isOtpValid) {
      throw new ForbiddenException('Invalid OTP');
    }

    user.verificationStatus = SellerVerificationStatus.VERIFIED;
    await user.save();

    const data = this.generateTokenProvider.generateTokens(user);
    return apiResponse({ data, message: 'OTP verified successfully' });
  }

  public async getMe(authUserPayload: IActiveUser) {
    const user = await this.userModel.findById(
      new Types.ObjectId(authUserPayload.sub),
    );

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return apiResponse({ data: user, message: 'User fetched successfully' });
  }

  public async forgotPassword(payload: ForgotPasswordDto) {
    const user = await this.userModel
      .findOne({ phone: payload.phone })
      .select('+password');

    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }
    const hashedPassword = await this.hashingProvider.hashPassword(
      payload.newPassword,
    );

    user.password = hashedPassword;
    await user.save();

    return apiResponse({ message: 'Password changed successfully.' });
  }
}
