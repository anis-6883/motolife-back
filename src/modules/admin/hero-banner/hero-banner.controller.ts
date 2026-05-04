import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
  Put,
} from '@nestjs/common';
import { CreateHeroBannerDto } from './dto/create-hero-banner.dto';
import { UpdateHeroBannerDto } from './dto/update-hero-banner.dto';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { HeroBannerService } from './hero-banner.service';

@Controller()
@UseGuards(PermissionsGuard)
export class HeroBannerController {
  constructor(private readonly heroBannerService: HeroBannerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBannerDto: CreateHeroBannerDto) {
    return this.heroBannerService.create(createBannerDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.BANNER_SETUP)
  findAll() {
    return this.heroBannerService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.BANNER_SETUP)
  findById(@Param('id') id: string) {
    return this.heroBannerService.findById(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.BANNER_SETUP)
  update(
    @Param('id') id: string,
    @Body() updateBannerDto: UpdateHeroBannerDto,
  ) {
    return this.heroBannerService.update(id, updateBannerDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.BANNER_SETUP)
  remove(@Param('id') id: string) {
    return this.heroBannerService.remove(id);
  }
}
