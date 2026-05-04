import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

@Schema({ timestamps: true, versionKey: false })
export class WishList extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Customer' })
  customer: Types.ObjectId;

  @Prop({ enum: ['product', 'combo'], required: true })
  type: 'product' | 'combo';

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  product?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ComboProduct' })
  comboProduct?: Types.ObjectId;

  @Prop()
  variantSku?: string;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const WishListSchema = SchemaFactory.createForClass(WishList);

WishListSchema.index({ customer: 1 });
WishListSchema.index({ product: 1, variantSku: 1 });
WishListSchema.index({ comboProduct: 1 });

WishListSchema.plugin(aggregatePaginate);

export { WishListSchema };
