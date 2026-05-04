import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import steadfastConfig from 'src/config/steadfast.config';
import type { ConfigType } from '@nestjs/config';
import { PlaceOrderDto } from './dto/place-order.dto';
import { apiResponse } from '../utils/api-response';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class DeliveryService {
  private readonly client: AxiosInstance;
  private readonly BASE_URL: string;

  constructor(
    @Inject(steadfastConfig.KEY)
    private readonly deliveryConfig: ConfigType<typeof steadfastConfig>,
  ) {
    this.BASE_URL = this.deliveryConfig.baseUrl!;

    this.client = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        'Api-Key': this.deliveryConfig.apiKey!,
        'Secret-Key': this.deliveryConfig.apiSecret!,
        'Content-Type': 'application/json',
      },
    });
  }

  async placeOrder(dto: PlaceOrderDto) {
    try {
      const { data } = await this.client.post('/create_order', dto);

      if (data.status !== 200) {
        throw new BadRequestException(
          data.message || 'Failed to place order to delivery',
        );
      }

      return apiResponse({
        data: data?.consignment,
        message: data?.message || 'Order placed successfully',
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async getDeliveryStatusByInvoice(invoice: string) {
    try {
      const { data } = await this.client.get(`/status_by_invoice/${invoice}`);

      if (data.status !== 200) {
        throw new BadRequestException(
          data.message || 'Failed to get delivery status',
        );
      }

      return apiResponse({
        message:
          data?.delivery_status || 'Delivery status fetched successfully',
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async getBalance() {
    try {
      const { data } = await this.client.get('/get_balance');

      if (data.status !== 200) {
        throw new BadRequestException(data.message || 'Failed to get balance');
      }

      return apiResponse({
        data: data?.current_balance,
        message: 'Balance fetched successfully',
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error.response?.data?.message ??
        error?.response?.data ??
        'Delivery partner API error';
      throw new HttpException(message, status);
    }
    throw new HttpException(
      'Unexpected error communicating with delivery partner',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
