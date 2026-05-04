export enum CustomerAccountStatus {
  ACTIVE = 'active',
  BANNED = 'banned',
  PARTIALLY_BANNED = 'partially_banned',
}

export enum Availability {
  INSTOCK = 'instock',
  UPCOMING = 'upcoming',
  OUTOFSTOCK = 'outofstock',
}

export enum BusinessSettingsEnum {
  GENERAL = 'general',
  VENDOR = 'vendor',
  CUSTOMER = 'customer',
  ORDER = 'order',
  WITHDRAW_METHODS = 'withdrawMethods',
  SHIPPING = 'shipping',
  ANALYTICS = 'analytics',
}

export enum ProductSortFields {
  PRICE = 'price',
  CREATED_AT = 'createdAt',
  RATING = 'rating',
  TOTAL_SOLD = 'quantitySold',
  DISCOUNT_PRICE = 'discountPrice',
}
