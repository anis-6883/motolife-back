import { Document, Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Category extends Document {
  @Prop({ type: String, isRequired: true, trim: true })
  name: string;

  @Prop({ type: Number, default: 0 })
  position: number;

  @Prop({ type: String })
  image: string;

  @Prop({ type: String, unique: true, required: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  parent: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    return ret;
  },
});

CategorySchema.index({ parent: 1 });
CategorySchema.index({ name: 1 });

CategorySchema.pre('save', async function () {
  if (this.isNew) {
    const model = this.constructor as Model<Category>;

    const lastCategory = await model.findOne().sort({ position: -1 });

    this.position =
      lastCategory && lastCategory.position ? lastCategory.position + 1 : 1;
  }
});

export { CategorySchema };
