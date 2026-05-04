import { Module } from '@nestjs/common';
import { RoleModule } from '../role/role.module';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';

@Module({
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService],
  imports: [RoleModule],
})
export class CouponModule {}
