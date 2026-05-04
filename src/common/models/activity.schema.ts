import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { ActivityAction, ResourceType } from 'src/common/enums/admin.enum';

@Schema({ timestamps: true, versionKey: false })
export class Activity extends Document {
  @Prop({ type: String, isRequired: true, trim: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'Admin', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: ActivityAction, required: true, index: true })
  action: ActivityAction;

  @Prop({ type: String, enum: ResourceType, required: true, index: true })
  resourceType: ResourceType;

  @Prop({ type: Types.ObjectId })
  resourceId: Types.ObjectId;

  @Prop({ type: String, trim: true })
  description: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  payload: Record<string, any>;

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const ActivitySchema = SchemaFactory.createForClass(Activity);

ActivitySchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    delete ret.softDeleted;
    return ret;
  },
});

ActivitySchema.plugin(aggregatePaginate);

export { ActivitySchema };
