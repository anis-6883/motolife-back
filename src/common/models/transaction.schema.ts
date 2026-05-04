import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ versionKey: false, timestamps: true })
export class Transaction extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vendor' })
  vendorId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: [
      'PAYMENT', // customer pays
      'REFUND', // refund to customer
      'VENDOR_PAYOUT', // vendor withdraw
      'COMMISSION', // admin earning
      'ADJUSTMENT', // manual fix
    ],
    required: true,
  })
  type: string;
  

  @Prop({
    type: String,
    enum: ['IN', 'OUT'],
    required: true,
  })
  direction: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'BDT' })
  currency: string;

  @Prop({
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  })
  status: string;

  @Prop()
  paymentMethod?: string;

  @Prop()
  gatewayTransactionId?: string;

  @Prop()
  gatewayResponse?: string;
  

  @Prop({ unique: true })
  transactionNumber: string;
    // OFFLINE / BANK INFO
  @Prop()
  bankName?: string;

  @Prop()
  bankAccountNumber?: string;

  @Prop()
  bankTransactionRef?: string;

  @Prop()
  branchName?: string;

  @Prop()
  receiptImage?: string;
  @Prop({
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  })
  approvalStatus?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  verifiedBy?: Types.ObjectId;

  @Prop()
  note?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
