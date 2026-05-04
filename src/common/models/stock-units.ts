import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

@Schema({ timestamps: true, versionKey: false, collection: 'stock_units' })
export class StockUnits extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Seller', required: true })
  sellerId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  parentSku: string;

  @Prop({
    type: String,
  })
  variation: string;

  @Prop({
    type: String,
    unique: true,
    required: true,
  })
  sku: string;

  @Prop({
    type: Boolean,
    default: false,
    index: true,
  })
  isDamaged: boolean;

  @Prop({
    type: Number,
    default: 0,
  })
  damagePercentage: number;

  @Prop({
    type: String,
  })
  damageDescription: string;

  @Prop({
    type: Number,
    required: true,
  })
  sellingPrice: number;

  @Prop({
    type: Boolean,
    default: false,
  })
  softDeleted: boolean;
}

const StockUnitsSchema = SchemaFactory.createForClass(StockUnits);

StockUnitsSchema.plugin(aggregatePaginate);

StockUnitsSchema.index({ productId: 1, variation: 1 });

export { StockUnitsSchema };
