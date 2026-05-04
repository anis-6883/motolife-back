import { Document, Model } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

@Schema({ timestamps: true, versionKey: false })
export class Brand extends Document {
  @Prop({ type: String, isRequired: true, trim: true })
  name: string;

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: String })
  image: string;

  @Prop({ type: Number, default: 0 })
  position: number;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const BrandSchema = SchemaFactory.createForClass(Brand);

BrandSchema.plugin(aggregatePaginate);

BrandSchema.pre('save', async function () {
  if (this.isNew) {
    const model = this.constructor as Model<Brand>;

    const lastBrand = await model.findOne().sort({ position: -1 });

    this.position =
      lastBrand && lastBrand.position ? lastBrand.position + 1 : 1;
  }
});

BrandSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    return ret;
  },
});

export { BrandSchema };
