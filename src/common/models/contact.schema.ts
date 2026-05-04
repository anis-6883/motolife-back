import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export class Reply {
  @Prop({ type: String, required: true })
  subject: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String, enum: ['admin', 'seller'], default: 'admin' })
  replyBy: 'admin' | 'seller';
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Contact extends Document {
  @Prop({ type: String, required: true })
  fullName: string;

  @Prop({ type: String, required: true })
  subject: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: Boolean, default: false })
  hasReplied: boolean;

  @Prop({ type: Boolean, default: false })
  seen: boolean;

  @Prop({ type: [Reply], default: [] })
  replies: Reply[];

  @Prop({ type: Boolean, default: false, select: false })
  softDeleted: boolean;
}

const ContactSchema = SchemaFactory.createForClass(Contact);

ContactSchema.plugin(aggregatePaginate);

export { ContactSchema };
