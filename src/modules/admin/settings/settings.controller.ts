import {
  Controller,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Delete,
  Param,
  Post,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { Policy, UpdateSettingsDto } from './dto/update-settings.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class SettingsController {
  constructor(private readonly businessSettingsService: SettingsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SETTINGS)
  getSettings() {
    return this.businessSettingsService.getSettings();
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.SETTINGS)
  async updateSection(@Body() body: UpdateSettingsDto) {
    return this.businessSettingsService.updateSection(body);
  }

  @Post('/policy')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.SETTINGS)
  async addPolicy(@Body() body: Policy) {
    return this.businessSettingsService.addPolicy(body);
  }

  @Patch('/policy/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.SETTINGS)
  async updatePolicy(@Body() body: Policy, @Param('id') id: string) {
    return this.businessSettingsService.updatePolicy(id, body);
  }

  @Delete('/policy/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.SETTINGS)
  async deletePolicy(@Param('id') id: string) {
    return this.businessSettingsService.deletePolicy(id);
  }
}
