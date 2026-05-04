import { Document, Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DISCOUNT_TYPE, PRODUCT_STATUS } from 'src/common/enums/products.enum';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

@Schema({ _id: false, versionKey: false })
class VideoLink {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  title: string;

  @Prop({})
  thumbnail: string;
}

@Schema({ collection: 'combo_products', timestamps: true, versionKey: false })
export class ComboProduct extends Document {
  @Prop({
    type: String,
    required: true,
  })
  name: string;

  @Prop({
    type: String,
    isRequired: true,
  })
  productId: string;

  @Prop({
    type: String,
    isRequired: true,
  })
  description: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    sparse: true,
  })
  sku: string;

  @Prop({
    type: String,
  })
  shippingTime: string;

  @Prop({
    type: [String],
  })
  searchTags: string[];

  @Prop({
    type: String,
    isRequired: true,
  })
  thumbnail: string;

  @Prop({
    type: [String],
  })
  images: string[];

  @Prop({ type: Number, isRequired: true })
  sellingPrice: number;

  @Prop({ type: Boolean })
  hasDiscount: boolean;

  @Prop({ type: String, enum: DISCOUNT_TYPE })
  discountType: DISCOUNT_TYPE;

  @Prop({ type: Number })
  discountValue: number;

  @Prop({ type: Number })
  discountPrice: number;

  @Prop({ type: Number })
  buyingPrice: number;

  @Prop({ type: Number })
  stockQuantity: number;

  @Prop({ type: Types.ObjectId })
  benefit: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  seller: Types.ObjectId;

  @Prop({ type: Object })
  sizeGuide: {
    images: string[];
    description: string;
  };

  @Prop({ type: String, unique: true, required: true })
  slug: string;

  @Prop({
    type: [VideoLink],
  })
  videoLinks: VideoLink[];

  @Prop({ type: Boolean })
  isPublished: boolean;

  @Prop({ type: Boolean })
  isFeatured: boolean;

  @Prop({ type: Boolean })
  isNewArrived: boolean;

  @Prop({ type: Boolean })
  isUpcoming: boolean;

  @Prop({ type: Boolean })
  hasOffer: boolean;

  @Prop({ type: Number })
  rating: number;

  @Prop({ type: [Object] })
  faq: {
    question: string;
    answer: string;
  }[];

  @Prop({ type: Number, default: 0 })
  quantitySold: number;

  @Prop({ type: Number, default: 0 })
  totalOrderAmount: number;

  @Prop({ type: String, enum: PRODUCT_STATUS, default: PRODUCT_STATUS.PENDING })
  status: PRODUCT_STATUS;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const ComboProductSchema = SchemaFactory.createForClass(ComboProduct);

ComboProductSchema.plugin(aggregatePaginate);

ComboProductSchema.index({ productId: 1 }, { unique: true });
ComboProductSchema.index({ sku: 1 }, { unique: true, sparse: true });
ComboProductSchema.index({ seller: 1 });
ComboProductSchema.index({ status: 1 });
ComboProductSchema.index({ sellingPrice: 1 });
ComboProductSchema.index({ rating: -1 });
ComboProductSchema.index({ slug: 1, sku: 1 });

ComboProductSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    return ret;
  },
});

ComboProductSchema.pre('save', async function () {
  if (this.isNew) {
    const model = this.constructor as Model<ComboProduct>;
    const length = await model.countDocuments({}).exec();
    this.productId = `PR${Date.now().toString().slice(-6)}${(
      length + 1
    ).toString()}`;
  }
});

export { ComboProductSchema };
