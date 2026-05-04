import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import paginate from 'mongoose-paginate-v2';

export enum AnnouncementType {
  INFORMATION = 'INFORMATION',
  ALERT = 'ALERT',
  SUCCESS = 'SUCCESS',
  PROMOTION = 'PROMOTION',
  UPDATE = 'UPDATE',
}

export enum DisplayStyle {
  BANNER_BAR = 'BANNER_BAR',
  POPUP = 'POPUP',
  INLINE_MESSAGE = 'INLINE_MESSAGE',
  SCROLLING_MESSAGE = 'SCROLLING_MESSAGE',
}

export enum SystemType {
  ALL = 'ALL',
  SELLER = 'SELLER',
  CUSTOMER = 'CUSTOMER',
}

@Schema({ timestamps: true, versionKey: false })
export class Announcements extends Document {
  @Prop({ type: String, isRequired: true, trim: true, unique: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({
    type: String,
    enum: AnnouncementType,
    required: true,
  })
  type: AnnouncementType;

  @Prop({
    type: String,
    enum: DisplayStyle,
    required: true,
  })
  displayStyle: DisplayStyle;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ type: String, enum: SystemType, default: SystemType.ALL })
  selectedSystem: SystemType;

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;
}

const AnnouncementsSchema = SchemaFactory.createForClass(Announcements);

AnnouncementsSchema.plugin(paginate);

AnnouncementsSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    delete ret.softDeleted;
    return ret;
  },
});

export { AnnouncementsSchema };
