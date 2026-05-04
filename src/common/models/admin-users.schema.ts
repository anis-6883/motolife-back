import mongoose, { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { AdminType } from '../enums/admin.enum';

@Schema({ collection: 'admins', timestamps: true, versionKey: false })
export class AdminUser extends Document {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String, isRequired: true, unique: true })
  phone: string;

  @Prop({ type: String, isRequired: true, unique: true })
  email: string;

  @Prop({ type: String })
  image: string;

  @Prop({ type: String, enum: AdminType, default: AdminType.MANAGER })
  type: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Role', isRequired: true })
  role: Types.ObjectId;

  @Prop({ type: String, enum: ['passport', 'nid'] })
  identifyType: string;

  @Prop({ type: String })
  identifyImage: string;

  @Prop({ type: String })
  identifyNumber: string;

  @Prop({ type: String, select: false })
  password: string;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;

  @Prop({ type: Boolean, default: true })
  status: boolean;
}

const AdminUserSchema = SchemaFactory.createForClass(AdminUser);
AdminUserSchema.plugin(aggregatePaginate);

AdminUserSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

export { AdminUserSchema };
