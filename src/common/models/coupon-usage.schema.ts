import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'coupon_usages',
})
export class CouponUsage extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Coupon' })
  coupon: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer' })
  customer: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Seller', default: [] })
  sellers: Types.ObjectId[];
}

const CouponUsageSchema = SchemaFactory.createForClass(CouponUsage);

CouponUsageSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

CouponUsageSchema.plugin(aggregatePaginate);

CouponUsageSchema.index({ coupon: 1 });
CouponUsageSchema.index({ customer: 1 });
CouponUsageSchema.index({ sellers: 1 });

export { CouponUsageSchema };
