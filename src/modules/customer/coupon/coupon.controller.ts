import { Controller, Get, Query } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { GetCouponQueryDto } from './dto/get-coupon-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { type IActiveUser } from '../auth/interfaces/active-user.interface';

@Controller()
@Auth(AuthType.Bearer)
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get()
  findAll(@ActiveUser() user: IActiveUser, @Query() query: GetCouponQueryDto) {
    return this.couponService.findAll(user, query);
  }
}
