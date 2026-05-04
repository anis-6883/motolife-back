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
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { GetAnnouncementsQueryDto } from './dto/get-announcement-query.dto';
import { AnnouncementService } from './announcement.service';

@Controller()
@UseGuards(PermissionsGuard)
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENT_SETUP)
  create(@Body() createAnnouncementDto: CreateAnnouncementDto) {
    return this.announcementService.create(createAnnouncementDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENT_SETUP)
  findAll(@Query() query: GetAnnouncementsQueryDto) {
    return this.announcementService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENT_SETUP)
  findById(@Param('id') id: string) {
    return this.announcementService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENT_SETUP)
  update(
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ) {
    return this.announcementService.update(id, updateAnnouncementDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENT_SETUP)
  remove(@Param('id') id: string) {
    return this.announcementService.remove(id);
  }
}
