export enum SellerAccountStatus {
  LIVE = 'live',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
  ON_VACATION = 'on_vacation',
}

export enum SellerVerificationStatus {
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  NON_VERIFIED = 'non_verified',
}

export enum PaymentMethodType {
  BKASH = 'bkash',
  BANK = 'bank',
  CASH = 'cash',
}

export enum ShopType {
  INHOUSE = 'inhouse',
  DEFAULT = 'default',
}

export enum DisputeStatus {
  PROCESSING = 'processing',
  RESOLVED = 'resolved',
}

export enum BusinessType {
  PRIVATE_LIMITED_COMPANY = 'private_limited_company',
  PUBLIC_LIMITED_COMPANY = 'public_limited_company',
  INDIVIDUAL = 'individual',
  RETAIL = 'Retail',
  SOLE_PROPRIETORSHIP = 'sole_proprietorship',
  COMPANIES_LIMITED_BY_GUARANTEE = 'companies_limited_by_guarantee',
  COMPANY_WITH_UNLIMITED_LIABILITY = 'company_with_unlimited_liability',
}

export enum IdentityType {
  NID = 'nid',
  PASSPORT = 'passport',
}
export enum VacationDurationType {
  THIRTY_MINUTES = '30_minutes',
  ONE_HOUR = '1_hour',
  TWO_HOURS = '2_hours',
  THREE_HOURS = '3_hours',
  FOUR_HOURS = '4_hours',
  FIVE_HOURS = '5_hours',
  CUSTOM = 'custom',
  UNTIL_CHANGE = 'until_change',
}
