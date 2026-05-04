import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false })
export class Policy {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;
}

@Schema({ versionKey: false })
export class Settings extends Document {
  @Prop({ type: String })
  tagline: string;

  @Prop({ type: String })
  logo: string;

  @Prop({ type: String })
  favIcon: string;

  @Prop({ type: String })
  openGraphImage: string;

  @Prop({ type: String })
  openGraphTitle: string;

  @Prop({ type: String })
  openGraphDescription: string;

  @Prop({ type: [Policy] })
  policies: Policy[];

  @Prop({ type: Boolean })
  enableCustomerOtpLogin: boolean;

  @Prop({ type: Boolean })
  enableCustomerPasswordLogin: boolean;

  @Prop({ type: Boolean })
  enableSellerOtpLogin: boolean;

  @Prop({ type: Boolean })
  enableSellerPasswordLogin: boolean;

  @Prop({ type: Boolean })
  sellerApprovalRequired: boolean;

  @Prop({ type: Number })
  maxOtpHits: number;

  @Prop({ type: Number })
  otpResendTime: number;

  @Prop({ type: Number })
  otpBlockTime: number;

  @Prop({ type: Number })
  maxLoginHits: number;

  @Prop({ type: Number })
  loginBlockTime: number;
}

const SettingsSchema = SchemaFactory.createForClass(Settings);

export { SettingsSchema };
