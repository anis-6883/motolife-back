import { Controller, Get, Param } from '@nestjs/common';
import { HeroBannerService } from './hero-banner.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';

@Controller()
@Auth(AuthType.None)
export class HeroBannerController {
  constructor(private readonly heroBannerService: HeroBannerService) {}

  @Get()
  findAll() {
    return this.heroBannerService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.heroBannerService.findById(id);
  }
}
