import { SetMetadata } from '@nestjs/common';
import { AuthType } from '../../../../common/enums/auth-type.enum';
import { AUTH_TYPE_KEY } from '../../../../common/constants/auth.constants';

export const Auth = (...authTypes: AuthType[]) =>
  SetMetadata(AUTH_TYPE_KEY, authTypes);
