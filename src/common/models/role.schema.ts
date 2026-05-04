import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PERMISSIONS } from '../../modules/admin/role/constants/permissions.constants';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

@Schema({ timestamps: true, versionKey: false })
export class Role extends Document {
  @Prop({ type: String, isRequired: true, trim: true, unique: true })
  name: string;
  //enum: PERMISSIONS,
  @Prop({ type: [String], required: true })
  permissions: string[];

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    return ret;
  },
});

RoleSchema.plugin(aggregatePaginate);

export { RoleSchema };
