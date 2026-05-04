import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  Post,
  Body,
} from '@nestjs/common';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { AppreciationService } from './appreciation.service';
import { CreateAppreciationDto } from './dto/create-appreciation.dto';
import { GetAppreciationQueryDto } from './dto/get-appreciations.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class AppreciationController {
  constructor(private readonly appreciationService: AppreciationService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.USER_VENDOR)
  create(@Body() payload: CreateAppreciationDto) {
    return this.appreciationService.createAppreciation(payload);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USER_VENDOR)
  findById(@Param('id') id: string, @Query() query: GetAppreciationQueryDto) {
    return this.appreciationService.getAppreciations(id, query);
  }
}
