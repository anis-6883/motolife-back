import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { DISCOUNT_TYPE } from '../enums/products.enum';

export enum CouponType {
  DISCOUNT_ON_PURCHASE = 'discount_on_purchase',
  FREE_DELIVERY = 'free_delivery',
  FIRST_ORDER = 'first_order',
  PRODUCT_BASED = 'product_based',
}

export enum CouponBearer {
  ADMIN = 'admin',
  VENDOR = 'vendor',
}

export enum ProductType {
  ALL = 'all',
  WISHLIST = 'wishlist',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Coupon extends Document {
  @Prop({ type: String, enum: CouponType, required: true })
  type: CouponType;

  @Prop({ type: String, required: true, unique: true })
  code: string;

  @Prop({ type: String })
  title: string;

  @Prop({
    type: String,
    enum: CouponBearer,
    required: true,
    default: CouponBearer.ADMIN,
  })
  bearer: CouponBearer;

  @Prop({ type: [Types.ObjectId], ref: 'Seller', default: [] })
  sellers: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Customer', default: [] })
  customers: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Product' })
  products: Types.ObjectId[];

  @Prop({ type: String, enum: ProductType })
  productType: ProductType;

  @Prop({ type: Number })
  limit: number;

  @Prop({ type: Number })
  sellerThreshold: number;

  @Prop({ type: String, enum: DISCOUNT_TYPE })
  discountType: DISCOUNT_TYPE;

  @Prop({ type: Number })
  discountValue: number;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ type: Number, required: true, default: 0 })
  pointsRequired: number;

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const CouponSchema = SchemaFactory.createForClass(Coupon);

CouponSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

CouponSchema.index({ customers: 1 });
CouponSchema.index({ sellers: 1 });
CouponSchema.index({ products: 1 });

CouponSchema.plugin(aggregatePaginate);

export { CouponSchema };
