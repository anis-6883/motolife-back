import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import authConfig from 'src/config/auth.config';
import { REQUEST_KEY } from '../constants/auth.constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IdentityGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,

    @Inject(authConfig.KEY)
    private readonly jwtConfig: ConfigType<typeof authConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const http = context.switchToHttp();
      const request: Request = http.getRequest();
      const response: Response = http.getResponse();
      const userToken = this.extractTokenFromHeader(request);

      if (userToken) {
        const payload = await this.jwtService.verifyAsync(
          userToken,
          this.jwtConfig,
        );
        request[REQUEST_KEY] = {
          id: payload.sub,
          isGuest: false,
        };
      } else {
        const existingGuestToken = this.extractGuestTokenFromCookie(request);
        if (existingGuestToken) {
          request[REQUEST_KEY] = {
            id: existingGuestToken,
            isGuest: true,
          };
        } else {
          const newGuestToken = uuidv4();
          request[REQUEST_KEY] = {
            id: newGuestToken,
            isGuest: true,
          };

          const isProduction = process.env.NODE_ENV === 'production';

          response.cookie(this.jwtConfig.gidCookie, newGuestToken, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: this.jwtConfig.guestCookieTtlMs,
            secure: isProduction,
            ...(isProduction
              ? { domain: this.jwtConfig.productionDomain }
              : {}),
          });
        }
      }
    } catch (error) {
      throw error;
    }

    return true;
  }

  private extractTokenFromHeader(req: Request): string | undefined {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return undefined;
    }

    const [_, token] = header.split(' ') ?? [];
    return token;
  }

  private extractGuestTokenFromCookie(req: Request): string | undefined {
    return req.cookies?.[this.jwtConfig.gidCookie];
  }
}
