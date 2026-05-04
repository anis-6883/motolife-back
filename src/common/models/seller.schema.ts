import { Document, Schema as MongooseSchema } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  BusinessType,
  IdentityType,
  PaymentMethodType,
  SellerAccountStatus,
  SellerVerificationStatus,
  ShopType,
  VacationDurationType,
} from 'src/common/enums/seller.enums';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

@Schema({ _id: false, versionKey: false })
export class Store {
  @Prop({ type: String, required: true, trim: true })
  storeName: string;

  @Prop({ type: String })
  contactNumber: string;

  @Prop({ type: String })
  address: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  logoImage: string;

  @Prop({ type: String })
  coverImage: string;

  @Prop({ type: String, required: true })
  storeCategory: string;

  @Prop({ type: String, required: true })
  tradeLicenseNumber: string;

  @Prop({ type: String, required: true })
  tradeLicenseImage: string;

  @Prop({ type: String, required: true })
  nidOrPassportNumber: string;

  @Prop({ type: String, required: true })
  nidOrPassportImage: string;

  @Prop({ type: String, required: true })
  tinNumber: string;

  @Prop({ type: String, required: true })
  tinImage: string;

  @Prop({ type: String })
  binNumber: string;

  @Prop({ type: String })
  binImage: string;

  @Prop({ type: Date })
  expiry: Date;
}
@Schema({ _id: false, versionKey: false })
export class VacationSettings {
  @Prop({ type: Boolean, default: false })
  isOnVacation: boolean;

  @Prop({
    type: String,
    enum: Object.values(VacationDurationType),
    default: null,
  })
  durationType: VacationDurationType | null;

  @Prop({ type: Date, default: null })
  startAt: Date | null;

  @Prop({ type: Date, default: null })
  endsAt: Date | null;

  @Prop({ type: String, default: '' })
  note: string;
}
const VacationSettingsSchema = SchemaFactory.createForClass(VacationSettings);
const StoreSchema = SchemaFactory.createForClass(Store);

@Schema({ _id: false, versionKey: false })
export class BusinessSettings {
  @Prop({
    type: String,
    enum: Object.values(BusinessType),
    default: BusinessType.PRIVATE_LIMITED_COMPANY,
    required: true,
  })
  businessType: BusinessType;

  @Prop({ type: Boolean, default: true })
  isAvailable: boolean;

  // @Prop({ type: Boolean, default: false })
  // isOnVacation: boolean;

  // @Prop({ type: String })
  // vacationDuration: string;

  // @Prop({ type: String })
  // vacationNote: string;

  @Prop({ type: Number, default: 0 })
  minOrderAmount: number;

  @Prop({ type: VacationSettingsSchema, default: () => ({}) })
  vacation: VacationSettings;
}

const businessSettingsSchema = SchemaFactory.createForClass(BusinessSettings);

@Schema({ _id: true, discriminatorKey: 'methodType', versionKey: false })
export class PaymentMethod {
  @Prop({
    type: String,
    required: true,
    enum: PaymentMethodType,
  })
  methodType: PaymentMethodType;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);

@Schema({ _id: false, versionKey: false })
export class BkashPayment {
  @Prop({ type: String, required: true })
  phone: string;
}

const BkashSchema = SchemaFactory.createForClass(BkashPayment);

@Schema({ _id: false, versionKey: false })
export class BankPayment {
  @Prop({ type: String, required: true })
  bankName: string;

  @Prop({ type: String, required: true })
  accountHolderName: string;

  @Prop({ type: String, required: true })
  accountNumber: string;

  @Prop({ type: String, required: true })
  branchName: string;
}

const BankSchema = SchemaFactory.createForClass(BankPayment);

@Schema({ _id: false, versionKey: false })
export class Manager {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, enum: Object.values(IdentityType) })
  identityType: IdentityType;

  @Prop({ type: String })
  identityNumber: string;

  @Prop({ type: String })
  identityImage: string;
}

const ManagerSchema = SchemaFactory.createForClass(Manager);

@Schema({ timestamps: true, versionKey: false })
export class Seller extends Document {
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: String, required: true, unique: true })
  phone: string;

  @Prop({ type: String, required: true, lowercase: true, unique: true })
  email: string;

  @Prop({ type: String })
  image: string;

  @Prop({ type: String, select: false })
  password: string;

  @Prop({
    type: String,
    enum: Object.values(ShopType),
    default: ShopType.DEFAULT,
  })
  shopType: ShopType;

  @Prop({
    type: String,
    enum: Object.values(SellerAccountStatus),
    default: SellerAccountStatus.LIVE,
  })
  accountStatus: SellerAccountStatus;

  @Prop({
    type: String,
    enum: Object.values(SellerVerificationStatus),
    default: SellerVerificationStatus.NON_VERIFIED,
  })
  verificationStatus: SellerVerificationStatus;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;

  @Prop({ type: StoreSchema })
  store: Store;

  @Prop({ type: ManagerSchema })
  manager: Manager;

  @Prop({ type: businessSettingsSchema })
  businessSettings: BusinessSettings;

  @Prop({ type: Boolean, default: true })
  showSellerName: boolean;

  @Prop({ type: Number, default: 0, select: false })
  commission: number;

  @Prop({ type: Number, default: 0, select: false })
  gstNumber: number;

  @Prop({
    type: [PaymentMethodSchema],
    default: [],
  })
  paymentMethods: PaymentMethod[];

  @Prop({ type: Number, default: 0, min: 0 })
  totalOrders: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalProducts: number;

  @Prop({ type: Number, default: 0, min: 0 })
  balance: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalWithdrawn: number;

  @Prop({ type: Boolean, default: true })
  status: boolean;
}

const SellerSchema = SchemaFactory.createForClass(Seller);

SellerSchema.index({ shopType: 1 });

SellerSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    delete ret._v;
    return ret;
  },
});

SellerSchema.pre('save', function () {
  if (this.isModified()) {
    this.balance = this.balance < 0 ? 0 : this.balance;
    this.totalWithdrawn = this.totalWithdrawn < 0 ? 0 : this.totalWithdrawn;
    this.totalOrders = this.totalOrders < 0 ? 0 : this.totalOrders;
    this.totalProducts = this.totalProducts < 0 ? 0 : this.totalProducts;
  }
});

SellerSchema.plugin(aggregatePaginate);

const paymentMethodsArray = SellerSchema.path(
  'paymentMethods',
) as MongooseSchema.Types.DocumentArray;
paymentMethodsArray.discriminator(PaymentMethodType.BKASH, BkashSchema);
paymentMethodsArray.discriminator(PaymentMethodType.BANK, BankSchema);

export { SellerSchema };
