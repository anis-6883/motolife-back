import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetAnnouncementsQueryDto } from './dto/get-announcement-query.dto';
import { AnnouncementService } from './announcement.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';

@Controller()
@Auth(AuthType.None)
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Get()
  findAll(@Query() query: GetAnnouncementsQueryDto) {
    return this.announcementService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.announcementService.findById(id);
  }
}
