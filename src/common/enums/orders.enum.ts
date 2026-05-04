export enum REFUND_STATUS {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum REFUND_ITEM_STATUS {
  PENDING = 'pending',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
}

export enum PAYMENT_STATUS {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PAYMENT_METHOD {
  CASH = 'CASH',
  CARD = 'CARD',
  NET_BANKING = 'NET_BANKING',
}
