export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  VENDOR_PAYOUT = 'VENDOR_PAYOUT',
  COMMISSION = 'COMMISSION',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum TransactionDirection {
  IN = 'IN',
  OUT = 'OUT',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}
