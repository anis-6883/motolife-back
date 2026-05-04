import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AdminSignInDto } from './dtos/admin-signin.dto';
import { GenerateTokenProvider } from './providers/generate-token.provider';
import { AdminUser } from '../../../common/models/admin-users.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OtpProvider } from '../../../common/providers/sms/otp.provider';
import { IActiveUser } from './interfaces/active-user.interface';
import { HashingProvider } from './providers/hashing.provider';
import { apiResponse } from 'src/common/utils/api-response';
import { UpdateAdminUserDto } from '../admin-user/dto/update-admin.dto';
import { ChangeAdminPasswordDto } from './dtos/change-password.dto';
import { StorageService } from 'src/common/storage/storage.service';
import { OtpTokenProvider } from 'src/common/providers/sms/otp-token.provider';
import { Role } from 'src/common/models/role.schema';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    @InjectModel(AdminUser.name)
    private readonly userModel: Model<AdminUser>,
    private readonly generateTokenProvider: GenerateTokenProvider,
    private readonly otpProvider: OtpProvider,
    private readonly otpTokenProvider: OtpTokenProvider,
    private readonly hashingProvider: HashingProvider,
    private readonly storageService: StorageService,
  ) {}

  public async signIn(signInDto: AdminSignInDto) {
    const user = await this.userModel
      .findOne({ email: signInDto.email })
      .select('+password')
      .populate('role', 'name permissions');

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

    return apiResponse({
      data: {
        ...data,
        permissions: (user.role as any)?.permissions,
      },
      message: 'User sign in successfully',
    });
  }

  public async changePassword(
    payload: ChangeAdminPasswordDto,
    activeUser: IActiveUser,
  ) {
    const user = await this.userModel
      .findById(activeUser.sub)
      .select('+password');

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const isPasswordValid = await this.hashingProvider.comparePasswords(
      payload.oldPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new ForbiddenException('Old password is not correct');
    }

    const hashedPassword = await this.hashingProvider.hashPassword(
      payload.newPassword,
    );

    user.password = hashedPassword;
    await user.save();

    const data = this.generateTokenProvider.generateTokens(user);
    return apiResponse({ data, message: 'Password changed successfully' });
  }

  async update(activeUser: IActiveUser, updateUserDto: UpdateAdminUserDto) {
    const existingUser = await this.userModel.findById(activeUser.sub);

    if (!existingUser) {
      throw new NotFoundException('Admin not found');
    }

    if (updateUserDto._uploaded) {
      await this.storageService.deleteFileByUrl(existingUser.image);
    }

    const user = await this.userModel.findByIdAndUpdate(
      new Types.ObjectId(activeUser.sub),
      updateUserDto,
      {
        new: true,
      },
    );

    if (!user) {
      throw new NotFoundException('Admin not found');
    }

    return apiResponse({ message: 'Admin updated successfully' });
  }
  async getByEmail(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('Admin not found');
    }
    return user;
  }
  // public async sendOtp(signInDto: AdminSignInDto) {
  //   this.logger.log(`Endpoint`);
  //   const user = await this.userModel.findOne({ phone: signInDto.phone });

  //   if (!user) {
  //     throw new ForbiddenException('Invalid phone number');
  //   }

  //   const otp = await this.otpProvider.sendOtp(user.phone);
  //   const data = await this.otpTokenProvider.generateOtpToken({
  //     phone: user.phone,
  //     otp,
  //   });

  //   return data;
  // }

  // public async verifyOtp(
  //   signInDto: AdminSignInDto,
  //   otpPayload: { phone: string; otp: string },
  // ) {
  //   const user = await this.userModel.findOne({ phone: otpPayload.phone });

  //   if (!user) {
  //     throw new ForbiddenException('Invalid phone number');
  //   }
  //   const isOtpValid = this.otpProvider.verifyOtp(
  //     otpPayload.otp,
  //     signInDto.otp,
  //   );

  //   if (!isOtpValid) {
  //     throw new ForbiddenException('Invalid OTP');
  //   }

  //   return this.generateTokenProvider.generateTokens(user);
  // }

  public async getMe(authUserPayload: IActiveUser) {
    const [user] = await this.userModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(authUserPayload.sub) },
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'role',
          pipeline: [
            {
              $project: {
                _id: 0,
                name: 1,
                permissions: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$role',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          softDeleted: 0,
          password: 0,
          updatedAt: 0,
        },
      },
    ]);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return apiResponse({ data: user, message: 'Profile fetched successfully' });
  }
}
