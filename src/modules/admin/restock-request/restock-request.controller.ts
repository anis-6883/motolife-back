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
import { RestockRequestService } from './restock-request.service';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { GetRestockRequestsQueryDto } from './dtos/get-request-restock-query.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class RestockRequestController {
  constructor(private readonly productService: RestockRequestService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findAll(@Query() query: GetRestockRequestsQueryDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
