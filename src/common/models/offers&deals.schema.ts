import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { DISCOUNT_TYPE } from '../enums/products.enum';

export enum RESOURCE_TYPE {
  CATEGORY = 'category',
  CUSTOM = 'custom',
  STORE = 'store',
  FLASH_SALE = 'flash_sale',
  TODAYS_DEAL = 'todays_deal',
}

@Schema({ _id: false, versionKey: false })
export class OffersItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ type: Number })
  discountPrice: number;

  @Prop({ type: String, enum: DISCOUNT_TYPE, required: true })
  discountType: DISCOUNT_TYPE;

  @Prop({ type: Number, required: true })
  discountValue: number;
}

@Schema({ timestamps: true, versionKey: false })
export class Offers extends Document {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({ type: String, required: true })
  image: string;

  @Prop({ type: String })
  url: string;

  @Prop({ type: String, enum: RESOURCE_TYPE, default: RESOURCE_TYPE.CUSTOM })
  resourceType: RESOURCE_TYPE;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Seller' })
  sellerId: Types.ObjectId;

  @Prop({ type: [OffersItem] })
  items: OffersItem[];

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: String, unique: true, required: true })
  slug: string;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const OffersSchema = SchemaFactory.createForClass(Offers);

OffersSchema.plugin(aggregatePaginate);

OffersSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.__v;
    delete ret.softDeleted;
    delete ret.updatedAt;
    return ret;
  },
});

OffersSchema.index({ 'items.product': 1 });

export { OffersSchema };
