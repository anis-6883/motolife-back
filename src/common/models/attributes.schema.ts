import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import paginate from 'mongoose-paginate-v2';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Attribute extends Document {
  @Prop({ type: String, required: true, trim: true, unique: true })
  name: string;

  @Prop({ type: [String], default: [] })
  values: string[];

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: Boolean, default: false, select: false })
  softDeleted: boolean;
}

const AttributeSchema = SchemaFactory.createForClass(Attribute);

AttributeSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    return ret;
  },
});

AttributeSchema.plugin(paginate);

export { AttributeSchema };
