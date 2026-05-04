import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false, versionKey: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  product?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ComboProduct' })
  comboProduct?: Types.ObjectId;

  @Prop({ type: String, required: true })
  productName: string;

  @Prop({ type: Types.ObjectId, ref: 'Seller', required: true })
  seller: Types.ObjectId;

  @Prop({ type: String })
  sku: string;

  @Prop({ type: String })
  thumbnail: string;

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
  variantSku?: string;

  @Prop({ type: String })
  variation?: string;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: Number, required: true })
  unitPrice: number;

  @Prop({ type: Number, required: true })
  totalPrice: number;

  @Prop({ type: Boolean, default: false })
  isCombo: boolean;
}

@Schema({ timestamps: true, versionKey: false })
export class Cart extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: String })
  guestId: string;

  @Prop({ type: [CartItem], default: [] })
  items: CartItem[];

  @Prop({ type: Number, default: 0 })
  subtotal: number;

  @Prop({ type: Number, default: 0 })
  shippingFee: number;

  @Prop({ type: Number, default: 0 })
  tax: number;

  @Prop({ type: Types.ObjectId, ref: 'Coupon' })
  coupon: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  couponDiscount: number;

  @Prop({ type: Number, default: 0 })
  total: number;

  @Prop({
    type: Date,
    default: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })
  expiresAt: Date;
}

const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.index({ userId: 1, guestId: 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
CartSchema.index({ 'items.product': 1 });
CartSchema.index({ 'items.comboProduct': 1 });

// CartSchema.pre('save', function () {

// });

export { CartSchema };
