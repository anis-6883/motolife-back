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
  Put,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { type IActiveUser } from '../auth/interfaces/active-user.interface';
import { RequestRefundDto } from './dto/request-refund.dto';
import { IdentityGuard } from 'src/common/guards/identity.guard';
import type { UserIdentity } from 'src/common/interfaces/identity.interface';

interface CancelOrderBodyDto {
  cancellationReason?: string;
  cancellationNote?: string;
}

@Controller()
@Auth(AuthType.None)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth(AuthType.None)
  @UseGuards(IdentityGuard)
  createOrder(
    @ActiveUser() user: UserIdentity,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(user, createOrderDto);
  }

  @Get()
  @Auth(AuthType.Bearer)
  getOrders(@ActiveUser() user: IActiveUser, @Query() query?: OrderQueryDto) {
    return this.orderService.getOrders(user, query || {});
  }

  @Get('track')
  @Auth(AuthType.None)
  trackOrder(
    @Query('orderId') orderId: string,
    @Query('phone') phone: string,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.orderService.trackOrder(orderId, phone, user);
  }

  @Get(':orderId')
  @Auth(AuthType.Bearer)
  getOrderByOrderId(
    @Param('orderId') orderId: string,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.orderService.getOrderByOrderId(orderId, user);
  }

  @Put(':orderId/cancel')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.Bearer)
  cancelOrder(
    @Param('orderId') orderId: string,
    @Body() body: CancelOrderBodyDto,
    @ActiveUser() user: IActiveUser,
  ) {
    const { cancellationReason, cancellationNote } = body;
    return this.orderService.cancelOrder(
      orderId,
      { cancellationReason, cancellationNote },
      user,
    );
  }

  @Post(':orderId/refund')
  @HttpCode(HttpStatus.OK)
  refundOrder(
    @Param('orderId') orderId: string,
    @Body() body: RequestRefundDto,
  ) {
    return this.orderService.requestRefund(orderId, body);
  }
}
