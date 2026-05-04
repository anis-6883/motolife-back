import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetBannersQueryDto } from './dto/get-banner-query.dto';
import { BannerService } from './banner.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';

@Controller()
@Auth(AuthType.None)
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  findAll(@Query() query: GetBannersQueryDto) {
    return this.bannerService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.bannerService.findById(id);
  }
}
