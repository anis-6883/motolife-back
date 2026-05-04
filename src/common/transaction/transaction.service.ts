import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Transaction } from '../models/transaction.schema';
import { Model, Types } from 'mongoose';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { types } from 'joi';
import { apiResponse } from '../utils/api-response';
import { TransactionDirection, TransactionStatus, TransactionType } from './enums/transaction-type.enum';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
  ) {}

  private generateTxnNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();

    return `TXN-${timestamp}-${random}`;
  }

  private generateDefaultNote(data: CreateTransactionDto): string {
    const amountStr = `${data.amount} ${data.currency || 'BDT'}`;

    switch (data.type) {
      case 'PAYMENT':
        return `Payment of ${amountStr} received${data.orderId ? ` for order #${data.orderId}` : ''}.`;
      case 'REFUND':
        return `Refund of ${amountStr} issued${data.orderId ? ` for order #${data.orderId}` : ''}.`;
      case 'VENDOR_PAYOUT':
        return `Vendor payout of ${amountStr} processed${data.vendorId ? ` for vendor #${data.vendorId}` : ''}.`;
      case 'COMMISSION':
        return `Commission of ${amountStr} recorded${data.orderId ? ` for order #${data.orderId}` : ''}.`;
      case 'ADJUSTMENT':
        return `Manual adjustment of ${amountStr} applied.`;
      default:
        return `Transaction of ${amountStr} (${data.type}) — ${data.direction}.`;
    }
  }
  private toObjectId(id: any, field: string): Types.ObjectId {
    if (!id) {
      throw new BadRequestException(`${field} is required`);
    }

    if (typeof id !== 'string') {
      throw new BadRequestException(`${field} must be string`);
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${field}`);
    }

    return new Types.ObjectId(id);
  }
  async create(data: CreateTransactionDto) {
    const userId = this.toObjectId(data.userId, 'userId');

    const orderId = data.orderId
      ? this.toObjectId(data.orderId, 'orderId')
      : undefined;

    const vendorId = data.vendorId
      ? this.toObjectId(data.vendorId, 'vendorId')
      : undefined;

    if (typeof data.amount !== 'number' || data.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    const allowedTypes = [
      'PAYMENT',
      'REFUND',
      'VENDOR_PAYOUT',
      'COMMISSION',
      'ADJUSTMENT',
    ];

    if (!allowedTypes.includes(data.type)) {
      throw new BadRequestException('Invalid transaction type');
    }

    const allowedDirections = ['IN', 'OUT'];

    if (!allowedDirections.includes(data.direction)) {
      throw new BadRequestException('Invalid transaction direction');
    }

    const transaction = await this.transactionModel.create({
      ...data,
      userId,
      orderId,
      vendorId,
      currency: data.currency || 'BDT',
      status: TransactionStatus.PENDING,
      transactionNumber: this.generateTxnNumber(),
      note: data.note || this.generateDefaultNote(data),
    });

    if (!transaction) {
      return apiResponse({
        status: false,
        message: 'Failed to create transaction',
        data: null,
      });
    }

    return apiResponse({
      status: true,
      message: 'Transaction created successfully',
      data: transaction,
    });
  }

  async payment(userId: string, orderId: string, amount: number) {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid userId or orderId');
    }
    return this.create({
      userId,
      orderId,
      type: TransactionType.PAYMENT,
      direction: TransactionDirection.IN,
      amount,
    });
  }

  async refund(userId: string, orderId: string, amount: number) {
    return this.create({
      userId,
      orderId,
      type: TransactionType.REFUND,
      direction: TransactionDirection.OUT,
      amount,
    });
  }
  async vendorPayout(vendorId: string, amount: number) {
    return this.create({
      userId: vendorId,
      vendorId,
      type: TransactionType.VENDOR_PAYOUT,
      direction: TransactionDirection.OUT,
      amount,
    });
  }

  async updateStatus(
    transactionId: string,
    status: TransactionStatus,
    gatewayTransactionId?: string,
    gatewayResponse?: any,
  ) {
    return this.transactionModel.findByIdAndUpdate(
      transactionId,
      {
        status,
        gatewayTransactionId,
        gatewayResponse: gatewayResponse
          ? JSON.stringify(gatewayResponse)
          : undefined,
      },
      { new: true },
    );
  }

  async findByTxnNumber(txnNumber: string) {
    return this.transactionModel.findOne({ transactionNumber: txnNumber });
  }

  async findByOrder(orderId: string) {
    return this.transactionModel.find({ orderId });
  }
}
