import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Schema({ versionKey: false, collection: 'landing_sections' })
export class LandingSection {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: Number })
  position: number;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const LandingSectionSchema = SchemaFactory.createForClass(LandingSection);

LandingSectionSchema.pre('save', async function () {
  if (this.isNew) {
    const model = this.constructor as Model<LandingSection>;

    const lastTestimonial = await model.findOne().sort({ position: -1 });

    this.position =
      lastTestimonial && lastTestimonial.position
        ? lastTestimonial.position + 1
        : 1;
  }
});

export { LandingSectionSchema };
