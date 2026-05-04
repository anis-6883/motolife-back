import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import paginate from 'mongoose-paginate-v2';

@Schema({ _id: false, versionKey: false })
export class Benefit {
  @Prop({ type: String, isRequired: true, trim: true })
  heading: string;

  @Prop({ type: String, isRequired: true, trim: true })
  text: string;
}

@Schema({ timestamps: true, versionKey: false })
export class Benefits extends Document {
  @Prop({ type: String, isRequired: true, trim: true, unique: true })
  title: string;

  @Prop({ type: [Benefit], default: [] })
  benefits: Benefit[];

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const BenefitsSchema = SchemaFactory.createForClass(Benefits);

BenefitsSchema.plugin(paginate);

BenefitsSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    return ret;
  },
});

export { BenefitsSchema };
