import { Controller, Get, Param } from '@nestjs/common';
import { YoutubeService } from './youtube.service';
import { apiResponse } from '../utils/api-response';
import { Auth } from 'src/modules/admin/admin-auth/decorators/auth.decorator';
import { AuthType } from '../enums/auth-type.enum';

@Controller('youtube')
@Auth(AuthType.None)
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('video-title/:id')
  async getVideoTitle(@Param('id') id: string) {
    return this.youtubeService.getTitle(id);
  }
}
