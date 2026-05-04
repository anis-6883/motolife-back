import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { DisputeStatus, PaymentMethodType } from '../enums/seller.enums';

export enum WITHDRAW_STATUS {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
}

@Schema({ timestamps: true, versionKey: false, _id: false })
class Dispute {
  @Prop({ type: String })
  reason: string;

  @Prop({ type: String })
  subject: string;

  @Prop({
    type: String,
    enum: DisputeStatus,
    default: DisputeStatus.PROCESSING,
  })
  status: DisputeStatus;
}

@Schema({ timestamps: true, versionKey: false })
export class Withdraw extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Seller', required: true, index: true })
  seller: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({
    type: String,
    enum: PaymentMethodType,
    default: PaymentMethodType.CASH,
  })
  paymentMethod: PaymentMethodType;

  @Prop({
    type: String,
    enum: WITHDRAW_STATUS,
    default: WITHDRAW_STATUS.PENDING,
  })
  status: WITHDRAW_STATUS;

  @Prop({ type: String })
  note: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: String })
  accountNumber: string;

  @Prop({ type: Boolean, default: false })
  isDisputeOpen: boolean;

  @Prop({ type: Dispute })
  dispute: Dispute;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const WithdrawSchema = SchemaFactory.createForClass(Withdraw);

WithdrawSchema.plugin(aggregatePaginate);

export { WithdrawSchema };
