import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import authConfig from 'src/config/auth.config';
import { IActiveUser } from '../interfaces/active-user.interface';
import { Types } from 'mongoose';

@Injectable()
export class GenerateTokenProvider {
  constructor(
    private readonly jwtService: JwtService,

    @Inject(authConfig.KEY)
    private readonly jwtConfig: ConfigType<typeof authConfig>,
  ) {}

  public async signToken<T>(userId: string, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        // ...payload,
      },
      {
        secret: this.jwtConfig.secret,
        audience: this.jwtConfig.audience,
        issuer: this.jwtConfig.issuer,
        expiresIn,
      },
    );
  }

  public async generateTokens(user: {
    _id: Types.ObjectId | string;
    email: string;
    role: Types.ObjectId;
  }) {
    const accessToken = await this.signToken<Partial<IActiveUser>>(
      user._id.toString(),
      this.jwtConfig.accessTokenTtl,
      // {
      //   email: user.email,
      //   roleId: user.role,
      // },
    );
    return { token: accessToken };
  }
}
