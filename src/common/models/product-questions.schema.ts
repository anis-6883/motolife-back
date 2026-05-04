import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'product_questions',
})
export class ProductQuestion extends Document {
  @Prop({ type: Number, default: 1 })
  questionId: number;

  @Prop({ type: Types.ObjectId, ref: 'Customer' })
  customer: Types.ObjectId;

  @Prop({ type: String, trim: true })
  customerName: string;

  @Prop({ type: String, trim: true })
  customerEmail: string;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  product: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ComboProduct' })
  comboProduct: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  isGuest: boolean;

  @Prop({ type: String, required: true })
  question: string;

  @Prop({ type: String })
  answer: string;

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const ProductQuestionSchema = SchemaFactory.createForClass(ProductQuestion);

ProductQuestionSchema.index({ customer: 1 });
ProductQuestionSchema.index({ product: 1 });
ProductQuestionSchema.index({ comboProduct: 1 });

ProductQuestionSchema.plugin(aggregatePaginate);

ProductQuestionSchema.pre('save', async function () {
  if (this.isNew) {
    const model = this.constructor as Model<ProductQuestion>;

    const lastDoc = await model.countDocuments();

    this.questionId = lastDoc + 1;
  }
});

export { ProductQuestionSchema };
