import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import paginate from 'mongoose-paginate-v2';

@Schema({ timestamps: true, versionKey: false, collection: 'limited_stocks' })
export class LimitedStock extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Seller', required: true })
  seller: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId: Types.ObjectId;

  @Prop({
    type: String,
  })
  variantSku: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  softDeleted: boolean;
}

const LimitedStockSchema = SchemaFactory.createForClass(LimitedStock);

LimitedStockSchema.plugin(aggregatePaginate);
LimitedStockSchema.plugin(paginate);

export { LimitedStockSchema };
