import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'hero_banners',
})
export class HeroBanner extends Document {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String })
  url: string;

  @Prop({ type: String, required: true })
  image: string;

  @Prop({ type: String, default: '#fff' })
  bgColor: string;

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const HeroBannerSchema = SchemaFactory.createForClass(HeroBanner);

HeroBannerSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

export { HeroBannerSchema };
