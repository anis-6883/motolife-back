import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  Body,
  Patch,
} from '@nestjs/common';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { WithdrawService } from './withdraw.service';
import { GetWithdrawQueryDto } from './dtos/get-withdraw-query.dto';
import { UpdateWithdrawDto } from './dtos/update-withdraw.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class WithdrawController {
  constructor(private readonly withdrawService: WithdrawService) {}

  @Get()
  //@RequirePermissions(PERMISSIONS.ALL)
  findAll(@Query() query: GetWithdrawQueryDto) {
    return this.withdrawService.findAll(query);
  }

  @Get(':id')
  //@RequirePermissions(PERMISSIONS.ALL)
  findById(@Param('id') id: string) {
    return this.withdrawService.findById(id);
  }

  @Patch(':id')
  //@RequirePermissions(PERMISSIONS.ALL)
  update(@Param('id') id: string, @Body() dto: UpdateWithdrawDto) {
    return this.withdrawService.update(id, dto);
  }
}
