import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { TempService } from './temp.service';
import { GetTempsQueryDto } from './dto/get-temp-query.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class TempController {
  constructor(private readonly tempService: TempService) {}

  @Get()
  //@RequirePermissions(PERMISSIONS.ALL)
  findAll(@Query() query: GetTempsQueryDto) {
    return this.tempService.findAll(query);
  }

  @Delete()
  //@RequirePermissions(PERMISSIONS.ALL)
  removeAll() {
    return this.tempService.removeAll();
  }

  @Get(':id')
  //@RequirePermissions(PERMISSIONS.ALL)
  findById(@Param('id') id: string) {
    return this.tempService.findById(id);
  }

  @Delete(':id')
  //@RequirePermissions(PERMISSIONS.ALL)
  remove(@Param('id') id: string) {
    return this.tempService.remove(id);
  }
}
