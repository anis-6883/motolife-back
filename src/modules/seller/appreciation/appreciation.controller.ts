import { Controller, Get, Param, Query } from '@nestjs/common';
import { AppreciationService } from './appreciation.service';
import { GetAppreciationQueryDto } from './dto/get-appreciations.dto';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { type IActiveUser } from '../auth/interfaces/active-user.interface';

@Controller()
export class AppreciationController {
  constructor(private readonly appreciationService: AppreciationService) {}

  @Get()
  findById(
    @ActiveUser() user: IActiveUser,
    @Query() query: GetAppreciationQueryDto,
  ) {
    return this.appreciationService.getAppreciations(user.sub, query);
  }
}
