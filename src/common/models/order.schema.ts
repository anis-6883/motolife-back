import { Document, Model, Schema as MongooseSchema, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { DISCOUNT_TYPE } from '../enums/products.enum';
import { PAYMENT_METHOD, PAYMENT_STATUS } from '../enums/orders.enum';

export enum ORDER_STATUS {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

@Schema({ _id: false, versionKey: false })
export class OrderItem {
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

  @Prop({ type: String })
  variation?: string;

  @Prop({ type: Number, required: true })
  sellingPrice: number;

  @Prop({ type: Boolean })
  hasDiscount: boolean;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: Number, required: true })
  unitPrice: number;

  @Prop({ type: Number, required: true })
  totalPrice: number;

  @Prop({ type: Boolean, default: false })
  isCombo: boolean;
}

@Schema({ _id: false, versionKey: false })
export class ShippingAddress {
  @Prop({ type: String, required: true })
  fullName: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String })
  email?: string;

  @Prop({ type: String, required: true, trim: true })
  address: string;

  @Prop({ type: String, required: true })
  thana: string;

  @Prop({ type: String, required: true })
  district: string;
}

@Schema({ _id: false, versionKey: false })
export class BillingAddress {
  @Prop({ type: String, required: true })
  fullName: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String })
  email?: string;

  @Prop({ type: String, required: true, trim: true })
  address: string;

  @Prop({ type: String, required: true })
  thana: string;

  @Prop({ type: String, required: true })
  district: string;
}

@Schema({ _id: false, versionKey: false })
export class SpecialDiscount {
  @Prop({ type: String, enum: DISCOUNT_TYPE, required: true })
  discountType: string;

  @Prop({ type: Number, required: true })
  discountValue: number;

  @Prop({ type: Number })
  discountPrice: number;

  @Prop({ type: String })
  reason: string;
}

@Schema({ _id: false, versionKey: false })
export class PaymentDetails {
  @Prop({ type: String, enum: PAYMENT_METHOD, required: true })
  method: PAYMENT_METHOD;

  @Prop({ type: String, enum: PAYMENT_STATUS, default: PAYMENT_STATUS.PENDING })
  status: PAYMENT_STATUS;

  @Prop({ type: String })
  transactionId?: string;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({ type: Number })
  amount: number;

  @Prop({ type: String, default: 'BDT' })
  currency: string;
}

@Schema({ timestamps: true, versionKey: false })
export class Order extends Document {
  @Prop({ type: String, unique: true })
  orderId: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customer: Types.ObjectId;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ type: ShippingAddress, required: true })
  shippingAddress: ShippingAddress;

  @Prop({ type: BillingAddress })
  billingAddress?: BillingAddress;

  @Prop({ type: PaymentDetails, required: true })
  payment: PaymentDetails;

  @Prop({ type: Number, required: true })
  subtotal: number;

  @Prop({ type: Number })
  prevSubTotal: number;

  @Prop({ type: Number, required: true })
  shippingFee: number;

  @Prop({ type: Number, required: true })
  tax: number;

  @Prop({ type: Number, default: 0 })
  discount: number;

  @Prop({ type: Types.ObjectId, ref: 'Coupon' })
  coupon: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  couponDiscount: number;

  @Prop({ type: Number, required: true })
  total: number;

  @Prop({ type: Number, default: 0 })
  refundedAmount: number;

  @Prop({
    type: String,
    enum: ORDER_STATUS,
    default: ORDER_STATUS.PENDING,
    index: true,
  })
  status: ORDER_STATUS;

  @Prop({ type: SpecialDiscount })
  specialDiscount: SpecialDiscount | null;

  @Prop({ type: String })
  customerNote?: string;

  @Prop({ type: Number, default: 0 })
  totalItems: number;

  @Prop({ type: Number, default: 0 })
  totalQuantity: number;

  @Prop({ type: [Types.ObjectId], ref: 'Seller' })
  sellers: Types.ObjectId[];

  @Prop({ type: Date })
  deliveredAt?: Date;

  @Prop({ type: Date })
  cancelledAt?: Date;

  @Prop({ type: String })
  cancellationReason?: string;

  @Prop({ type: String })
  cancellationNote?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'AdminUser' })
  assignedTo: Types.ObjectId;

  @Prop({ type: Boolean, default: false, select: false })
  softDeleted: boolean;
}

const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.plugin(aggregatePaginate);

OrderSchema.index(
  { orderId: 1 },
  { unique: true, partialFilterExpression: { softDeleted: false } },
);
OrderSchema.index(
  { customer: 1, createdAt: -1 },
  { partialFilterExpression: { softDeleted: false } },
);
OrderSchema.index(
  { status: 1 },
  { partialFilterExpression: { softDeleted: false } },
);
OrderSchema.index(
  { 'payment.status': 1 },
  { partialFilterExpression: { softDeleted: false } },
);
OrderSchema.index(
  { 'items.product': 1 },
  { partialFilterExpression: { softDeleted: false } },
);
OrderSchema.index(
  { sellers: 1 },
  { partialFilterExpression: { softDeleted: false } },
);

OrderSchema.pre('save', async function () {
  if (this.isNew) {
    const model = this.constructor as Model<Order>;
    const length = await model.countDocuments({}).exec();
    this.orderId = `ORD${Date.now().toString().slice(-6)}${(
      length + 1
    ).toString()}`;

    this.prevSubTotal = this.subtotal;
  }
});

OrderSchema.pre('save', function () {
  this.totalItems = this.items.length;

  this.totalQuantity = this.items.reduce((acc, item) => acc + item.quantity, 0);

  this.sellers = [
    ...new Set(this.items.map((item) => new Types.ObjectId(item.seller))),
  ] as any;

  if (this.status === ORDER_STATUS.CANCELLED && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }
});

OrderSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.__v;
    delete ret.softDeleted;
    delete ret.updatedAt;
    return ret;
  },
});

OrderSchema.virtual('isCancellable').get(function () {
  return [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PROCESSING,
  ].includes(this.status);
});

OrderSchema.plugin(aggregatePaginate);

export { OrderSchema };
