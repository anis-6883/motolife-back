import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  HttpCode,
  Inject,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { WebhooksService } from './webhooks.service';
import { SteadfastWebhookDto } from './dto/steadfast.dto';
import steadfastConfig from 'src/config/steadfast.config';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhookService: WebhooksService,
    @Inject(steadfastConfig.KEY)
    private readonly deliveryConfig: ConfigType<typeof steadfastConfig>,
  ) {}

  @Post('steadfast')
  @HttpCode(200)
  async handleSteadfastWebhook(
    @Headers('authorization') authHeader: string,
    @Body() payload: SteadfastWebhookDto,
  ) {
    const expectedToken = this.deliveryConfig.apiSecret;
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== expectedToken) {
      throw new UnauthorizedException('Invalid webhook token');
    }

    return this.webhookService.handleSteadfastWebhook(payload);
  }
}
