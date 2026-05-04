import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Post,
} from '@nestjs/common';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { CouponService } from './coupon.service';
import { GetCouponQueryDto } from './dto/get-coupon-query.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.ORDER_MANAGEMENT)
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponService.create(createCouponDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ORDER_MANAGEMENT)
  findAll(@Query() query: GetCouponQueryDto) {
    return this.couponService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ORDER_MANAGEMENT)
  findById(@Param('id') id: string) {
    return this.couponService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ORDER_MANAGEMENT)
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponService.update(id, updateCouponDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ORDER_MANAGEMENT)
  remove(@Param('id') id: string) {
    return this.couponService.remove(id);
  }
}
