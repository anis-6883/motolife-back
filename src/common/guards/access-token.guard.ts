import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import authConfig from 'src/config/auth.config';
import { REQUEST_KEY } from '../constants/auth.constants';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,

    @Inject(authConfig.KEY)
    private readonly jwtConfig: ConfigType<typeof authConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractRequestFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('You are not authorized to access');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, this.jwtConfig);
      request[REQUEST_KEY] = payload;
    } catch (error) {
      throw error;
    }

    return true;
  }

  private extractRequestFromHeader(req: Request): string | undefined {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('You are not authorized to access');
    }

    const [_, token] = header.split(' ') ?? [];
    return token;
  }
}
