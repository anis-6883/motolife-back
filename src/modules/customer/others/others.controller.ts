import { Controller, Get, Param } from '@nestjs/common';
import { OthersService } from './others.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';
import { BusinessSettingsEnum } from 'src/common/enums/customer.enums';

@Controller()
@Auth(AuthType.None)
export class OthersController {
  constructor(private readonly othersService: OthersService) {}

  @Get()
  getSettings() {
    return this.othersService.getSettings();
  }

  @Get('policies')
  getPolicies() {
    return this.othersService.getPolicies();
  }

  @Get('business-settings/:section')
  getBusinessSettings(@Param('section') section: BusinessSettingsEnum) {
    return this.othersService.getBusinessSettings(section);
  }

  @Get('contact')
  getContact() {
    return this.othersService.getContactInformation();
  }
}
