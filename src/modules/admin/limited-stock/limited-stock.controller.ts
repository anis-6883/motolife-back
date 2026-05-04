import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { LimitedStockService } from './limited-stock.service';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { GetLimitedStockQueryDto } from './dtos/get-limited-stock-query.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class LimitedStockController {
  constructor(private readonly limitedStockService: LimitedStockService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findAll(@Query() query: GetLimitedStockQueryDto) {
    return this.limitedStockService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findById(@Param('id') id: string) {
    return this.limitedStockService.findById(id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  remove(@Param('id') id: string) {
    return this.limitedStockService.remove(id);
  }
}
