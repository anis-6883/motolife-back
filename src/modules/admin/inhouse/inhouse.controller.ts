import { Controller, Body, Patch, Param, UseGuards, Get } from '@nestjs/common';
import { InhouseService } from './inhouse.service';
import { UpdateInhouseDto } from './dto/update-inhouse.dto';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';

@Controller()
@UseGuards(PermissionsGuard)
export class InhouseController {
  constructor(private readonly accountService: InhouseService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.INHOUSE_SHOP)
  getInhouse() {
    return this.accountService.getInhouse();
  }

  @Get('/stats')
  @RequirePermissions(PERMISSIONS.INHOUSE_SHOP)
  getStats() {
    return this.accountService.getStats();
  }

  @Patch()
  @RequirePermissions(PERMISSIONS.INHOUSE_SHOP)
  update(@Body() updateInhouseDto: UpdateInhouseDto) {
    return this.accountService.update(updateInhouseDto);
  }
}
