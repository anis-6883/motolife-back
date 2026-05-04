import { Document, Model, Types, Schema as MongooseSchema } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import {
  PAYMENT_METHOD,
  REFUND_ITEM_STATUS,
  REFUND_STATUS,
} from '../enums/orders.enum';
import { PaymentMethodType } from '../enums/seller.enums';

@Schema({ _id: true, discriminatorKey: 'methodType', versionKey: false })
export class PaymentMethod {
  @Prop({
    type: String,
    required: true,
    enum: PaymentMethodType,
  })
  methodType: PaymentMethodType;
}

const RefundPaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);

@Schema({ _id: false, versionKey: false })
export class BkashPayment {
  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String, required: true })
  transactionId: string;
}

const BkashSchema = SchemaFactory.createForClass(BkashPayment);

@Schema({ _id: false, versionKey: false })
export class BankPayment {
  @Prop({ type: String, required: true })
  accountNumber: string;

  @Prop({ type: String, required: true })
  accountHolderName: string;

  @Prop({ type: String, required: true })
  bankName: string;

  @Prop({ type: String, required: true })
  branch: string;
}

const BankSchema = SchemaFactory.createForClass(BankPayment);

RefundPaymentMethodSchema.discriminator(PaymentMethodType.BKASH, BkashSchema);
RefundPaymentMethodSchema.discriminator(PaymentMethodType.BANK, BankSchema);

@Schema({ _id: false, versionKey: false })
export class RefundItem {
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  product?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ComboProduct' })
  comboProduct?: Types.ObjectId;

  @Prop({ type: String, required: true })
  productName: string;

  @Prop({ type: String })
  thumbnail: string;

  @Prop({ type: Types.ObjectId, ref: 'Seller', required: true })
  seller: Types.ObjectId;

  @Prop({ type: String, required: true })
  sku: string;

  @Prop({ type: String })
  variantSku?: string;

  @Prop({ type: String })
  variation?: string;

  @Prop({
    type: [
      {
        name: String,
        value: String,
      },
    ],
  })
  attributes: {
    name: string;
    value: string;
  }[];

  @Prop({ type: Number })
  sellingPrice: number;

  @Prop({ type: Boolean })
  hasDiscount: boolean;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: Number, required: true })
  unitPrice: number;

  @Prop({ type: Number, required: true })
  totalPrice: number;

  @Prop({
    type: String,
    enum: REFUND_ITEM_STATUS,
    default: REFUND_ITEM_STATUS.PENDING,
  })
  status: REFUND_ITEM_STATUS;

  @Prop({ type: Boolean, default: false })
  isCombo: boolean;
}

@Schema({ timestamps: true, versionKey: false })
export class Refund extends Document {
  @Prop({ type: String, unique: true })
  refundId: string;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customer: Types.ObjectId;

  @Prop({ type: [RefundItem], required: true })
  items: RefundItem[];

  @Prop({ type: String })
  refundReason: string;

  @Prop({ type: [String] })
  images: string[];

  @Prop({ type: String })
  details: string;

  @Prop({ type: String })
  note: string;

  @Prop({
    type: RefundPaymentMethodSchema,
  })
  refundMethod: PaymentMethod;

  @Prop({ type: Number, required: true })
  totalAmount: number;

  @Prop({ type: String, enum: REFUND_STATUS, default: REFUND_STATUS.PENDING })
  status: REFUND_STATUS;

  @Prop({ type: Types.ObjectId, ref: 'AdminUser' })
  assignedTo: Types.ObjectId;

  @Prop({ type: Boolean, default: false, select: false })
  softDeleted: boolean;
}

const RefundSchema = SchemaFactory.createForClass(Refund);

RefundSchema.index({ order: 1 });
RefundSchema.index({ customer: 1 });
RefundSchema.index({ status: 1 });

RefundSchema.pre('save', async function () {
  if (this.isNew) {
    const model = this.constructor as Model<Refund>;
    const length = await model.countDocuments({}).exec();
    this.refundId = `REF${Date.now().toString().slice(-6)}${(length + 1)
      .toString()
      .padStart(4, '0')}`;
  }
});

RefundSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.__v;
    delete ret.softDeleted;
    delete ret.updatedAt;
    return ret;
  },
});

RefundSchema.plugin(aggregatePaginate);

export { RefundSchema };
