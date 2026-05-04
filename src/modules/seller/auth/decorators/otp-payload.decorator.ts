import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { OTP_KEY } from '../../../../common/constants/auth.constants';

export const OtpPayload = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request[OTP_KEY];
  },
);
