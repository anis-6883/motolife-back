import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

@Schema({ _id: false, versionKey: false })
export class VariantRequests {
  @Prop({ type: String, isRequired: true })
  sku: string;

  @Prop({ type: Number })
  requests: number;
}

@Schema({ timestamps: true, versionKey: false, collection: 'restock_requests' })
export class RestockRequest extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    isRequired: true,
  })
  productId: Types.ObjectId;

  @Prop({
    type: [VariantRequests],
  })
  variantRequests: VariantRequests[];

  @Prop({
    type: Number,
    isRequired: true,
  })
  totalRequests: number;

  @Prop({
    type: Boolean,
    default: false,
  })
  softDeleted: boolean;
}

const RestockRequestSchema = SchemaFactory.createForClass(RestockRequest);

RestockRequestSchema.plugin(aggregatePaginate);

export { RestockRequestSchema };
