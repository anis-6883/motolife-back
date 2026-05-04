import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { GetBannersQueryDto } from './dto/get-banner-query.dto';
import { BannerService } from './banner.service';

@Controller()
@UseGuards(PermissionsGuard)
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.BANNER_SETUP)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBannerDto: CreateBannerDto) {
    return this.bannerService.create(createBannerDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.BANNER_SETUP)
  findAll(@Query() query: GetBannersQueryDto) {
    return this.bannerService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.BANNER_SETUP)
  findById(@Param('id') id: string) {
    return this.bannerService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.BANNER_SETUP)
  update(@Param('id') id: string, @Body() updateBannerDto: UpdateBannerDto) {
    return this.bannerService.update(id, updateBannerDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.BANNER_SETUP)
  remove(@Param('id') id: string) {
    return this.bannerService.remove(id);
  }
}
