import { Document, Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  DISCOUNT_TYPE,
  PRODUCT_STATUS,
  UNIT,
  Weight,
} from 'src/common/enums/products.enum';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

@Schema({ _id: false, versionKey: false })
export class Variant {
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

  @Prop({ type: String, required: true, trim: true })
  variation: string;

  @Prop({ type: Number, required: true })
  variantPrice: number;

  @Prop({ type: String, required: true, unique: true, sparse: true })
  sku: string;

  @Prop({ type: Number, required: true })
  stock: number;

  @Prop({ type: Boolean })
  hasDiscount: boolean;

  @Prop({ type: Boolean })
  isDamaged: boolean;

  @Prop({ type: String })
  damageType: string;

  @Prop({ type: String })
  damageDescription: string;

  @Prop({ type: Number })
  damagePercentage: number;

  @Prop({ type: String, enum: DISCOUNT_TYPE })
  discountType: string;

  @Prop({ type: Number })
  discountValue: number;

  @Prop({ type: Number })
  discountPrice: number;
}

@Schema({ _id: false, versionKey: false })
class VideoLink {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  title: string;

  @Prop({})
  thumbnail: string;
}

@Schema({ _id: false, versionKey: false })
class ColorImage {
  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  image: string;
}

@Schema({ timestamps: true, versionKey: false })
export class Product extends Document {
  @Prop({
    type: String,
    required: true,
  })
  name: string;

  @Prop({
    type: String,
  })
  productId: string;

  @Prop({
    type: String,
    required: true,
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
    type: Types.ObjectId,
    required: true,
  })
  category: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
  })
  subCategory: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
  })
  brand: Types.ObjectId;

  @Prop({
    type: String,
    enum: UNIT,
    required: true,
  })
  unit: UNIT;

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
    required: true,
  })
  thumbnail: string;

  @Prop({
    type: [String],
  })
  images: string[];

  @Prop({
    type: [VideoLink],
  })
  videoLinks: VideoLink[];

  @Prop({ type: Number, required: true })
  sellingPrice: number;

  @Prop({ type: String, enum: DISCOUNT_TYPE })
  discountType: DISCOUNT_TYPE;

  @Prop({ type: Boolean })
  hasDiscount: boolean;

  @Prop({ type: Number })
  discountValue: number;

  @Prop({ type: Number })
  discountPrice: number;

  @Prop({ type: Number, required: true })
  buyingPrice: number;

  @Prop({ type: Number, required: true })
  stockQuantity: number;

  @Prop({ type: String, unique: true, required: true })
  slug: string;

  @Prop({ type: String, enum: Weight })
  weight: Weight;

  @Prop({ type: Types.ObjectId })
  benefit: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  seller: Types.ObjectId;

  @Prop({ type: Object })
  sizeGuide: {
    images: string[];
    description: string;
  };

  @Prop({ type: [SchemaFactory.createForClass(ColorImage)] })
  colorWiseImages: ColorImage[];

  @Prop({ type: [Variant] })
  variants: Variant[];

  @Prop({ type: Number })
  rating: number;

  @Prop({ type: [Object] })
  faq: {
    question: string;
    answer: string;
  }[];

  @Prop({ type: Boolean, default: true })
  isPublished: boolean;

  @Prop({ type: Boolean })
  isFeatured: boolean;

  @Prop({ type: Boolean, default: true })
  isNewArrived: boolean;

  @Prop({ type: Boolean })
  isUpcoming: boolean;

  @Prop({ type: Boolean })
  hasOffer: boolean;

  @Prop({ type: Boolean })
  isLimited: boolean;

  @Prop({ type: String, enum: PRODUCT_STATUS, default: PRODUCT_STATUS.PENDING })
  status: PRODUCT_STATUS;

  @Prop({ type: Boolean, default: false })
  isDamaged: boolean;

  @Prop({ type: String })
  damageType: string;

  @Prop({ type: String })
  damageDescription: string;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;

  @Prop({ type: Number, default: 0 })
  quantitySold: number;

  @Prop({ type: Number, default: 0 })
  totalOrderAmount: number;
}

const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.plugin(aggregatePaginate);

ProductSchema.index({ productId: 1 }, { unique: true });
ProductSchema.index({ sku: 1 }, { unique: true, sparse: true });
ProductSchema.index({ seller: 1 });
ProductSchema.index({ category: 1, subCategory: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ sellingPrice: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ slug: 1, sku: 1 });

ProductSchema.index(
  { name: 'text', description: 'text', searchTags: 'text' },
  { weights: { name: 10, searchTags: 5, description: 1 } },
);

ProductSchema.pre('save', async function () {
  if (this.isNew) {
    const model = this.constructor as Model<Product>;
    const length = await model.countDocuments({}).exec();
    this.productId = `PR${Date.now().toString().slice(-6)}${(
      length + 1
    ).toString()}`;
  }
  if (this.isModified('quantitySold')) {
    this.quantitySold = this.quantitySold < 0 ? 0 : this.quantitySold;
  }

  if (this.isModified('totalOrderAmount')) {
    this.totalOrderAmount =
      this.totalOrderAmount < 0 ? 0 : this.totalOrderAmount;
  }
});

ProductSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    return ret;
  },
});

export { ProductSchema };
