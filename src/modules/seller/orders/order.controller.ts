import { Controller, Get, Param, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderQueryDto } from './dto/order-query.dto';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import type { IActiveUser } from '../auth/interfaces/active-user.interface';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  getOrders(@ActiveUser() user: IActiveUser, @Query() query?: OrderQueryDto) {
    return this.orderService.getOrders(user, query || {});
  }

  @Get('stats')
  getStats(@ActiveUser() user: IActiveUser) {
    return this.orderService.getOrderStats(user);
  }

  @Get(':orderId')
  getOrderById(
    @ActiveUser() user: IActiveUser,
    @Param('orderId') orderId: string,
  ) {
    return this.orderService.getOrderById(user, orderId);
  }
}
