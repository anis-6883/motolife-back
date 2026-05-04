import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { PlaceOrderDto } from './dto/place-order.dto';
import { AuthType } from '../enums/auth-type.enum';
import { Auth } from 'src/modules/admin/admin-auth/decorators/auth.decorator';

@Controller('delivery')
@Auth(AuthType.None)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('place-order')
  async placeOrder(@Body() placeOrderDto: PlaceOrderDto) {
    return this.deliveryService.placeOrder(placeOrderDto);
  }

  @Get('status/:invoice')
  async statusByInvoice(@Param('invoice') invoice: string) {
    return this.deliveryService.getDeliveryStatusByInvoice(invoice);
  }

  @Get('balance')
  async getBalance() {
    return this.deliveryService.getBalance();
  }
}
