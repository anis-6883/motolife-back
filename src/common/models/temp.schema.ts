import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import paginate from 'mongoose-paginate-v2';

@Schema({ versionKey: false, timestamps: true })
export class Temp {
  @Prop({ type: String, required: true })
  key: string;

  @Prop({ type: String, required: true })
  url: string;
}

const TempSchema = SchemaFactory.createForClass(Temp);

TempSchema.plugin(paginate);

TempSchema.index({ key: 1 });
TempSchema.index({ url: 1 });

export { TempSchema };
