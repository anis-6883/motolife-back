import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  Body,
  Patch,
  Put,
} from '@nestjs/common';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { RefundService } from './refund.service';
import { GetRefundQueryDto } from './dtos/get-refund-query.dto';
import { MakeRefundDto, RejectRefundDto } from './dtos/refund.dto';
import { ActiveUser } from '../admin-auth/decorators/active-user.decorator';
import { type IActiveUser } from '../admin-auth/interfaces/active-user.interface';
import { UpdateRefundDto } from './dtos/update-refund.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ORDER, PERMISSIONS.REFUND_MANAGEMENT)
  findAll(@Query() query: GetRefundQueryDto) {
    return this.refundService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ORDER, PERMISSIONS.REFUND_MANAGEMENT)
  findById(@Param('id') id: string) {
    return this.refundService.findById(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.ORDER, PERMISSIONS.REFUND_MANAGEMENT)
  updateRefund(
    @Param('id') id: string,
    @Body() dto: UpdateRefundDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.refundService.updateRefund(id, dto, user);
  }

  @Patch(':id/refund-all')
  @RequirePermissions(PERMISSIONS.ORDER, PERMISSIONS.REFUND_MANAGEMENT)
  refundAll(
    @Param('id') id: string,
    @ActiveUser() user: IActiveUser,
    @Body() dto: Pick<MakeRefundDto, 'refundMethod'>,
  ) {
    return this.refundService.refundAll(id, user, dto);
  }

  @Patch(':id/refund')
  @RequirePermissions(PERMISSIONS.ORDER, PERMISSIONS.REFUND_MANAGEMENT)
  refund(
    @Param('id') id: string,
    @Body() dto: MakeRefundDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.refundService.refundSingle(id, dto, user);
  }

  @Patch(':id/reject')
  @RequirePermissions(PERMISSIONS.ORDER, PERMISSIONS.REFUND_MANAGEMENT)
  reject(
    @Param('id') id: string,
    @Body() dto: MakeRefundDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.refundService.rejectSingle(id, dto, user);
  }

  @Patch(':id/reject-all')
  @RequirePermissions(PERMISSIONS.ORDER, PERMISSIONS.REFUND_MANAGEMENT)
  rejectAll(
    @Param('id') id: string,
    @Body() dto: RejectRefundDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.refundService.rejectAll(id, dto, user);
  }
}
