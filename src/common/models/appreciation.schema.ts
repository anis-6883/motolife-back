import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

@Schema({ timestamps: true, versionKey: false })
export class Appreciation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Seller' })
  seller: Types.ObjectId;

  @Prop({ type: String })
  subject: string;

  @Prop({ type: String })
  message: string;
}

const AppreciationSchema = SchemaFactory.createForClass(Appreciation);

AppreciationSchema.index({ seller: 1 });

AppreciationSchema.plugin(aggregatePaginate);

export { AppreciationSchema };
