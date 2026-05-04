import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import paginate from 'mongoose-paginate-v2';

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'combo_banners',
})
export class ComboBanner extends Document {
  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, required: true, trim: true })
  description: string;

  @Prop({ type: String, required: true })
  image: string;

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: String })
  url: string;

  @Prop({ type: Boolean, default: false, select: false })
  softDeleted: boolean;
}

const ComboBannerSchema = SchemaFactory.createForClass(ComboBanner);

ComboBannerSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    return ret;
  },
});

ComboBannerSchema.plugin(paginate);

export { ComboBannerSchema };
