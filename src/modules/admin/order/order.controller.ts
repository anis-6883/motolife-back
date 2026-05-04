import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Delete,
  Req,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { UpdateOrderDto } from './dto/update-order.dto';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { ActiveUser } from '../admin-auth/decorators/active-user.decorator';
import { type IActiveUser } from '../admin-auth/interfaces/active-user.interface';

@Controller()
@UseGuards(PermissionsGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // @Post()
  // @HttpCode(HttpStatus.CREATED)
  // createOrder(@Body() createOrderDto: CreateOrderDto) {
  //   return this.orderService.createOrder(createOrderDto);
  // }

  @Get()
  @RequirePermissions(PERMISSIONS.ALL, PERMISSIONS.ORDER)
  getOrders(@ActiveUser() user: IActiveUser, @Query() query?: OrderQueryDto) {
    return this.orderService.getOrders(query || {}, user);
  }

  @Get('stats')
  @RequirePermissions(PERMISSIONS.ALL, PERMISSIONS.ORDER)
  getStats(@ActiveUser() user: IActiveUser) {
    return this.orderService.getOrderStats(user);
  }

  @Get(':orderId')
  @RequirePermissions(PERMISSIONS.ALL, PERMISSIONS.ORDER)
  getOrderById(@Param('orderId') orderId: string) {
    return this.orderService.getOrderById(orderId);
  }

  @Patch(':orderId')
  @RequirePermissions(PERMISSIONS.ALL, PERMISSIONS.ORDER)
  updateOrder(
    @Param('orderId') orderId: string,
    @Body() update: UpdateOrderDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.orderService.updateOrder(orderId, update, user);
  }

  @Patch(':orderId/special-discount')
  @RequirePermissions(PERMISSIONS.ALL, PERMISSIONS.ORDER)
  applySpecialDiscount(
    @Param('orderId') orderId: string,
    @Body() update: UpdateOrderDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.orderService.applyDiscount(orderId, update, user);
  }

  @Delete(':orderId/special-discount')
  @RequirePermissions(PERMISSIONS.ALL, PERMISSIONS.ORDER)
  removeSpecialDiscount(
    @Param('orderId') orderId: string,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.orderService.removeDiscount(orderId, user);
  }
}
