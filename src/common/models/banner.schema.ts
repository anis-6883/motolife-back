import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export enum BannerType {
  MAIN_SECTION_BANNER = 'MAIN_SECTION_BANNER',
  FLASH_SALE = 'FLASH_SALE',
  COMBO_OFFER = 'COMBO_OFFER',
  BEST_DEAL = 'BEST_DEAL',
}

export enum ResourceType {
  PRODUCT = 'product',
  CATEGORY = 'category',
  CUSTOM = 'custom',
  STORE = 'store',
  COMBO = 'combo',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Banner extends Document {
  @Prop({ type: String, enum: BannerType, required: true })
  type: BannerType;

  @Prop({ type: String, enum: ResourceType, default: ResourceType.CUSTOM })
  resourceType: ResourceType;

  @Prop({ type: String })
  bannerUrl: string;

  @Prop({ type: String })
  title: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String, default: 'Shop Now' })
  buttonText: string;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ComboProduct' })
  comboProductId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Seller' })
  sellerId: Types.ObjectId;

  @Prop({ type: String, required: true })
  image: string;

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const BannerSchema = SchemaFactory.createForClass(Banner);

BannerSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

BannerSchema.plugin(aggregatePaginate);

export { BannerSchema };
