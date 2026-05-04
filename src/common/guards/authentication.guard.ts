import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthType } from '../enums/auth-type.enum';
import { Reflector } from '@nestjs/core';
import { AccessTokenGuard } from './access-token.guard';
import { Observable } from 'rxjs';
import { AUTH_TYPE_KEY } from '../constants/auth.constants';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private static readonly defaultAuthType = AuthType.Bearer;

  private readonly authTypeGuardMap: Record<
    AuthType,
    CanActivate | CanActivate[]
  >;

  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.Bearer]: this.accessTokenGuard,
      [AuthType.None]: { canActivate: () => true },
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypes = this.reflector.getAllAndOverride<AuthType[]>(
      AUTH_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? [AuthenticationGuard.defaultAuthType];

    const guards = authTypes
      .map((authType) => this.authTypeGuardMap[authType])
      .flat();

    for (const guard of guards) {
      try {
        const canActivate = await guard.canActivate(context);
        if (canActivate === true) {
          return true;
        }
      } catch (err) {
        throw err;
      }
    }
    throw new UnauthorizedException();
  }
}
