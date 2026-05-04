import { ClientSession, Document, HydratedDocument, Model } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  CurrencyPosition,
  DeliveryResponsibility,
  PaymentOption,
  ShippingZoneType,
  UsablePlace,
  VerificationOption,
  WithdrawFieldType,
} from 'src/common/enums/admin.enum';
import { SystemType } from 'src/common/models/announcement.schema';

@Schema({ _id: false })
class SupportInfo {
  @Prop({ type: String })
  email: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: String })
  whatsapp: string;

  @Prop({ type: String })
  facebook: string;
}

@Schema({ _id: false })
class WithdrawField {
  @Prop({ type: String })
  name: string;

  @Prop({
    type: String,
    enum: WithdrawFieldType,
    default: WithdrawFieldType.TEXT,
  })
  type: WithdrawFieldType;

  @Prop({ type: String })
  placeholder: string;

  @Prop({ type: Boolean })
  isRequired: boolean;
}

@Schema({
  versionKey: false,
  _id: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class GeneralSettings {
  @Prop({ type: Date })
  maintenanceTimeStart?: Date;

  @Prop({ type: Date })
  maintenanceTimeEnd?: Date;

  @Prop({ type: String })
  maintenanceMessage: string;

  @Prop({ type: String, enum: SystemType, default: SystemType.ALL })
  maintenanceSystem: SystemType;

  @Prop({ type: String })
  currency: string;

  @Prop({
    type: String,
    enum: CurrencyPosition,
    default: CurrencyPosition.LEFT,
  })
  currencyPosition: CurrencyPosition;

  @Prop({ type: [String], enum: PaymentOption, default: [PaymentOption.CASH] })
  paymentOptions: PaymentOption[];

  @Prop({ type: SupportInfo })
  support: SupportInfo;
}

const GeneralSettingsSchema = SchemaFactory.createForClass(GeneralSettings);

GeneralSettingsSchema.virtual('maintenanceModeEnabled').get(function () {
  const now = new Date();

  return (
    this.maintenanceTimeStart &&
    this.maintenanceTimeEnd &&
    now >= this.maintenanceTimeStart &&
    now <= this.maintenanceTimeEnd
  );
});

@Schema({ versionKey: false, _id: false })
export class VendorSettings {
  @Prop({ type: Boolean, default: false })
  minOrderAmountEnabled: boolean;

  @Prop({ type: Boolean, default: true })
  canReplyOnReview: boolean;

  @Prop({ type: Boolean, default: true })
  canAddComboProduct: boolean;

  @Prop({ type: Boolean, default: true })
  needNewProductApproval: boolean;

  @Prop({ type: Boolean, default: true })
  needUpdateProductApproval: boolean;

  @Prop({
    type: [String],
    enum: VerificationOption,
    default: [VerificationOption.PHONE],
  })
  verificationOptions: VerificationOption[];

  @Prop({ type: Number, default: 0 })
  stockThreshold: number;
}

@Schema({ versionKey: false, _id: false })
export class CustomerSettings {
  @Prop({ type: Boolean, default: false })
  isBonusPointsEnabled: boolean;

  @Prop({ type: Number })
  minPurchaseAmount: number;

  @Prop({ type: Number })
  earnedPoints: number;

  @Prop({ type: Number })
  pointValue: number;

  @Prop({ type: String, enum: UsablePlace })
  usablePlace: UsablePlace;
}

@Schema({ versionKey: false, _id: false })
export class OrderSettings {
  @Prop({ type: Boolean, default: true })
  guestCheckoutEnabled: boolean;

  @Prop({ type: Boolean, default: true })
  showVatOrTax: boolean;

  @Prop({ type: Boolean, default: false })
  isFreeDeliveryEnabled: boolean;

  @Prop({ type: Number })
  freeDeliveryThreshold: number;

  @Prop({ type: String, enum: DeliveryResponsibility })
  freeDeliveryResponsibility: DeliveryResponsibility;

  @Prop({ type: Number })
  maxRefundableDays: number;
}

@Schema({ versionKey: false, _id: false })
export class WithdrawMethod {
  @Prop({ type: String })
  name: string;

  @Prop({ type: [WithdrawField] })
  fields: WithdrawField[];

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;
}

@Schema({ versionKey: false, _id: false })
export class ShippingCost {
  @Prop({ type: String, enum: ShippingZoneType })
  zone: ShippingZoneType;

  @Prop({ type: Number })
  cost: number;
}

@Schema({ versionKey: false, _id: false })
export class ShippingSettings {
  @Prop({
    type: [String],
    enum: ShippingZoneType,
    default: [
      ShippingZoneType.INSIDE_DHAKA,
      ShippingZoneType.OUTSIDE_DHAKA,
      ShippingZoneType.NEAR_DHAKA,
    ],
  })
  shippingZones: ShippingZoneType[];

  @Prop({ type: [ShippingCost] })
  shippingCosts: ShippingCost[];

  @Prop({ type: String })
  deliveryTime: string;

  @Prop({ type: String, default: '' })
  shippingTimeText: string;
}

@Schema({ versionKey: false, _id: false })
export class AnalyticsSettings {
  @Prop({ type: Boolean, default: false })
  googleSearchConsoleEnabled: boolean;

  @Prop({ type: String })
  googleSearchConsoleVerificationId: string;

  @Prop({ type: Boolean, default: false })
  googleAnalyticsEnabled: boolean;

  @Prop({ type: String })
  googleAnalyticsId: string;

  @Prop({ type: Boolean, default: false })
  facebookPixelEnabled: boolean;

  @Prop({ type: String })
  facebookPixelId: string;

  @Prop({ type: Boolean, default: false })
  twitterPixelEnabled: boolean;

  @Prop({ type: String })
  twitterPixelId: string;
}

@Schema({
  versionKey: false,
  collection: 'business_settings',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class BusinessSettings extends Document {
  @Prop({ type: GeneralSettingsSchema })
  general: GeneralSettings;

  @Prop({ type: VendorSettings })
  vendor: VendorSettings;

  @Prop({ type: CustomerSettings })
  customer: CustomerSettings;

  @Prop({ type: OrderSettings })
  order: OrderSettings;

  @Prop({ type: [WithdrawMethod] })
  withdrawMethods: WithdrawMethod[];

  @Prop({ type: ShippingSettings })
  shipping: ShippingSettings;

  @Prop({ type: AnalyticsSettings })
  analytics: AnalyticsSettings;
}

const BusinessSettingsSchema = SchemaFactory.createForClass(BusinessSettings);

export { BusinessSettingsSchema };
