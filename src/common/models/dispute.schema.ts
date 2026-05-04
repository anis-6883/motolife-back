import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export enum DisputeStatus {
  PROCESSING = 'processing',
  RESOLVED = 'resolved',
}

export class Reply {
  @Prop({ type: String, required: true })
  subject: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String, enum: ['admin', 'seller'] })
  replyBy: 'admin' | 'seller';
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Dispute extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Seller', required: true })
  seller: Types.ObjectId;

  @Prop({ type: String, required: true })
  subject: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String })
  mail: string;

  @Prop({
    type: String,
    enum: DisputeStatus,
    default: DisputeStatus.PROCESSING,
  })
  status: DisputeStatus;

  @Prop({ type: [Reply], default: [] })
  replies: Reply[];

  @Prop({ type: Boolean, default: false, select: false })
  softDeleted: boolean;
}

const DisputeSchema = SchemaFactory.createForClass(Dispute);

DisputeSchema.plugin(aggregatePaginate);

export { DisputeSchema };
