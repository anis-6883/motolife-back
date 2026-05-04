import { Controller, Get, Param, Query } from '@nestjs/common';
import { LimitedStockService } from './limited-stock.service';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { type IActiveUser } from '../auth/interfaces/active-user.interface';
import { QueryLimitedStockDto } from './dto/query-limited-stock.dto';
import { Types } from 'mongoose';

@Controller()
export class LimitedStockController {
  constructor(private readonly limitedStockService: LimitedStockService) {}

  @Get()
  findAll(
    @ActiveUser() user: IActiveUser,
    @Query() query: QueryLimitedStockDto,
  ) {
    return this.limitedStockService.getAllLimitedStockNotification(user, query);
  }

  @Get(':id')
  findById(@ActiveUser() user: IActiveUser, @Param('id') id: string) {
    return this.limitedStockService.getOneLimitedStockNotification(
      user,
      new Types.ObjectId(id),
    );
  }
}
