import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CustomerSignInDto } from './dtos/customer-signin.dto';
import { GenerateTokenProvider } from './providers/generate-token.provider';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OtpProvider } from '../../../common/providers/sms/otp.provider';
import { OtpTokenProvider } from 'src/common/providers/sms/otp-token.provider';
import { IActiveUser } from './interfaces/active-user.interface';
import { Customer } from 'src/common/models/customers.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { CustomerSignupDto } from './dtos/customer-signup.dto';

@Injectable()
export class CustomerAuthService {
  constructor(
    @InjectModel(Customer.name)
    private readonly userModel: Model<Customer>,
    private readonly generateTokenProvider: GenerateTokenProvider,
    private readonly otpProvider: OtpProvider,
    private readonly otpTokenProvider: OtpTokenProvider,
  ) {}

  public async signIn(signInDto: CustomerSignInDto) {
    const user = await this.userModel.findOne({ phone: signInDto.phone });

    if (!user) {
      throw new ForbiddenException('Phone number is not registered');
    }

    const data = this.generateTokenProvider.generateTokens(user);
    return apiResponse({ data, message: 'User sign in successfully' });
  }

  public async sendOtp(signInDto: CustomerSignInDto) {
    const user = await this.userModel.findOne({ phone: signInDto.phone });

    if (!user) {
      throw new ForbiddenException('Phone number is not registered');
    }

    const otp = await this.otpProvider.sendOtp(user.phone);

    const data = this.otpTokenProvider.generateOtpToken({
      phone: user.phone,
      otp,
    });

    return apiResponse({
      data,
      message: 'Otp sent successfully',
    });
  }

  public async sendSignupOtp(signupDto: Omit<CustomerSignupDto, 'otp'>) {
    const userExists = await this.userModel.findOne({ phone: signupDto.phone });

    if (userExists) {
      throw new BadRequestException('Account already exists');
    }

    const otp = await this.otpProvider.sendOtp(signupDto.phone);
    const data = this.otpTokenProvider.generateOtpToken({
      phone: signupDto.phone,
      otp,
    });

    return apiResponse({
      data: data,
      message: 'Otp sent successfully',
    });
  }

  public async verifyOtp(
    signInDto: CustomerSignInDto,
    otpPayload: { phone: string; otp: string },
  ) {
    const user = await this.userModel.findOne({ phone: otpPayload.phone });

    if (!user) {
      throw new ForbiddenException('Invalid OTP ');
    }

    const isOtpValid = this.otpProvider.verifyOtp(
      otpPayload.otp,
      signInDto.otp,
    );

    if (!isOtpValid) {
      throw new ForbiddenException('Invalid OTP ');
    }

    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    const data = await this.generateTokenProvider.generateTokens(user);
    return apiResponse({ data, message: 'User sign in successfully' });
  }

  public async verifySignupOtp(
    signupDto: CustomerSignupDto,
    otpPayload: { otp: string },
  ) {
    const isOtpValid = this.otpProvider.verifyOtp(
      otpPayload.otp,
      signupDto.otp,
    );

    if (!isOtpValid) {
      throw new ForbiddenException('Invalid OTP');
    }

    const userExists = await this.userModel.findOne({ phone: signupDto.phone });

    if (userExists) {
      throw new BadRequestException('Account already exists');
    }

    const user = await this.userModel.create({
      ...signupDto,
      isVerified: true,
    });

    const data = await this.generateTokenProvider.generateTokens(user);

    return apiResponse({ data, message: 'User signed up successfully' });
  }

  public async getMe(authUserPayload: IActiveUser) {
    const user = await this.userModel
      .findById(new Types.ObjectId(authUserPayload.sub))
      .select('-softDeleted -createdAt -updatedAt -__v');

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return apiResponse({ data: user, message: 'User fetched successfully' });
  }

  public async sendPhoneChangeOtp(updateDto: Pick<CustomerSignupDto, 'phone'>) {
    const userExists = await this.userModel.findOne({ phone: updateDto.phone });

    if (userExists) {
      throw new BadRequestException('Account already exists');
    }

    const otp = await this.otpProvider.sendOtp(updateDto.phone);
    const data = this.otpTokenProvider.generateOtpToken({
      phone: updateDto.phone,
      otp,
    });

    return apiResponse({
      data: data,
      message: 'Otp sent successfully',
    });
  }

  public async verifyPhoneChangeOtp(
    user: IActiveUser,
    updateDto: Pick<CustomerSignupDto, 'phone' | 'otp'>,
    otpPayload: { otp: string },
  ) {
    const isOtpValid = this.otpProvider.verifyOtp(
      otpPayload.otp,
      updateDto.otp,
    );

    if (!isOtpValid) {
      throw new ForbiddenException('Invalid OTP');
    }

    const userExists = await this.userModel.findOne({ phone: updateDto.phone });

    if (userExists) {
      throw new BadRequestException('Account already exists');
    }

    await this.userModel.findByIdAndUpdate(
      user.sub,
      { phone: updateDto.phone },
      {
        new: true,
      },
    );

    return apiResponse({ message: 'Phone updated successfully' });
  }
}
