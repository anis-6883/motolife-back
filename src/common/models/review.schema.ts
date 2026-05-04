import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

@Schema({ versionKey: false, timestamps: true })
export class Review extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ComboProduct' })
  comboProductId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer' })
  customerId: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  isAnonymous: boolean;

  @Prop({ type: String })
  customerName: string;

  @Prop({ type: String })
  customerPhone: string;

  @Prop({ type: [String] })
  images: string[];

  @Prop({ type: Types.ObjectId, ref: 'Seller', required: true })
  sellerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Seller' })
  replyBy: Types.ObjectId;

  @Prop({ type: Number, required: true })
  rating: number;

  @Prop({ type: String })
  review: string;

  @Prop({ type: String })
  reply: string;

  @Prop({ type: Boolean, default: true })
  willPublish: boolean;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.plugin(aggregatePaginate);

ReviewSchema.index({ productId: 1 });
ReviewSchema.index({ customerId: 1 });
ReviewSchema.index({ rating: 1 });

export { ReviewSchema };
