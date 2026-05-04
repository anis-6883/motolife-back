import { BankPaymentDto, BkashPaymentDto } from '../dto/create-seller.dto';

export type PaymentMethodDto = (
  | (BkashPaymentDto & { _id?: string })
  | (BankPaymentDto & { _id?: string })
)[];
