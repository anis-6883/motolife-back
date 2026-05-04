import { Document, Schema as MongooseSchema } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CustomerAccountStatus } from 'src/common/enums/customer.enums';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { PaymentMethodType } from '../enums/seller.enums';

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

const CustomerPaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);

@Schema({ _id: false, versionKey: false })
export class BkashPayment {
  @Prop({ type: String, required: true })
  phone: string;
}

const BkashSchema = SchemaFactory.createForClass(BkashPayment);

@Schema({ _id: false, versionKey: false })
export class BankPayment {
  @Prop({ type: String, required: true })
  cardNumber: string;

  @Prop({ type: String, required: true })
  cardHolderName: string;

  @Prop({ type: String, required: true })
  expiry: string;

  @Prop({ type: String, required: true })
  cvv: string;
}

const BankSchema = SchemaFactory.createForClass(BankPayment);

@Schema({ versionKey: false })
export class Address {
  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, required: true, trim: true })
  address: string;

  @Prop({ type: String, required: true })
  thana: string;

  @Prop({ type: String, required: true })
  district: string;
}

const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({ timestamps: true, versionKey: false })
export class Customer extends Document {
  @Prop({ type: String, required: true, trim: true })
  fullName: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({
    type: String,
    // unique: true,
    // sparse: true,
    // trim: true,
    // set: (value: string | null | undefined) => {
    //   if (typeof value !== 'string') {
    //     return value ?? undefined;
    //   }

    //   const normalizedValue = value.trim().toLowerCase();
    //   return normalizedValue || undefined;
    // },
  })
  email?: string;

  @Prop({ type: String })
  image: string;

  @Prop({ type: [AddressSchema], default: [] })
  addresses: Address[];

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ type: Number, default: 0 })
  totalOrders: number;

  @Prop({
    type: String,
    enum: Object.values(CustomerAccountStatus),
    default: CustomerAccountStatus.ACTIVE,
  })
  accountStatus: CustomerAccountStatus;

  @Prop({ type: Boolean, default: false })
  softDeleted: boolean;

  @Prop({ type: Number, default: 0 })
  totalPoints: number;

  @Prop({ type: Number, default: 0 })
  availablePoints: number;

  @Prop({
    type: [CustomerPaymentMethodSchema],
    default: [],
  })
  paymentMethods: PaymentMethod[];
}

const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.updatedAt;
    return ret;
  },
});

CustomerSchema.plugin(aggregatePaginate);

CustomerSchema.index({ fullName: 1, phone: 1 });
CustomerSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { softDeleted: false } },
);

const paymentMethodsArray = CustomerSchema.path(
  'paymentMethods',
) as MongooseSchema.Types.DocumentArray;
paymentMethodsArray.discriminator(PaymentMethodType.BKASH, BkashSchema);
paymentMethodsArray.discriminator(PaymentMethodType.BANK, BankSchema);

export { CustomerSchema };
