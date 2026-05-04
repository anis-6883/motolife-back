import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UPDATE_REQUEST_STATUS } from '../enums/products.enum';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

@Schema({ timestamps: true, versionKey: false, collection: 'update_requests' })
export class UpdateRequests extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Product', isRequired: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Seller', isRequired: true })
  sellerId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed })
  changedData: Record<string, any>;

  @Prop({ type: String, trim: true })
  note: string;

  @Prop({
    type: String,
    enum: UPDATE_REQUEST_STATUS,
    default: UPDATE_REQUEST_STATUS.PENDING,
  })
  status: UPDATE_REQUEST_STATUS;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const UpdateRequestsSchema = SchemaFactory.createForClass(UpdateRequests);

UpdateRequestsSchema.plugin(aggregatePaginate);

UpdateRequestsSchema.index({ productId: 1, status: 1 });
UpdateRequestsSchema.index({ status: 1, createdAt: -1 });

UpdateRequestsSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    return ret;
  },
});

export { UpdateRequestsSchema };
