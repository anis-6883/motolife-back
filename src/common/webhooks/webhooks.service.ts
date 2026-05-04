import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  SteadfastDeliveryStatusDto,
  SteadfastWebhookDto,
} from './dto/steadfast.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order, ORDER_STATUS } from '../models/order.schema';
import { Model } from 'mongoose';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
  ) {}

  async handleSteadfastWebhook(payload: SteadfastWebhookDto) {
    try {
      switch (payload.notification_type) {
        case 'delivery_status':
          this.logger.log(
            `Received Steadfast webhook: ${payload.notification_type} for invoice #${payload.invoice}`,
          );

          await this.handleDeliveryStatus(
            payload as SteadfastDeliveryStatusDto,
          );
          break;

        default:
          this.logger.warn(
            `Unknown notification type: ${payload.notification_type}`,
          );
          break;
      }

      return {
        status: HttpStatus.OK,
        message: 'Webhook received successfully.',
      };
    } catch (error) {
      this.logger.error(
        `Failed to handle Steadfast webhook: ${error.message}`,
        error.stack,
      );
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to handle webhook.',
      };
    }
  }

  async handleDeliveryStatus(payload: SteadfastDeliveryStatusDto) {
    try {
      this.logger.log(
        `Handling webhook: Order ${payload.invoice} | ${payload.status}`,
      );

      const order = await this.orderModel.findOne({ orderId: payload.invoice });

      if (!order) {
        this.logger.warn(`Order not found for invoice: ${payload.invoice}`);
        return;
      }

      if (payload.status === 'delivered') {
        order.status = ORDER_STATUS.DELIVERED;
      } else if (payload.status === 'cancelled') {
        order.status = ORDER_STATUS.CANCELLED;
      }

      await order.save();

      this.logger.log(
        `Order ${order.orderId} status updated to ${order.status}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update order status via webhook: ${error.message}`,
        error.stack,
      );
    }
  }
}
