export enum CurrencyPosition {
  LEFT = 'left',
  RIGHT = 'right',
}

export enum PaymentOption {
  CASH = 'cash',
  CARD = 'card',
  MOBILE = 'mobile',
}

export enum VerificationOption {
  EMAIL = 'email',
  PHONE = 'phone',
}

export enum UsablePlace {
  COUPON = 'coupon',
  PRODUCTS = 'products',
  SHIPPING = 'shipping',
  ORDERS = 'orders',
}

export enum DeliveryResponsibility {
  SELLER = 'seller',
  ADMIN = 'admin',
}

export enum WithdrawFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  EMAIL = 'email',
  PHONE = 'phone',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
}

export enum ShippingZoneType {
  INSIDE_DHAKA = 'inside_dhaka',
  OUTSIDE_DHAKA = 'outside_dhaka',
  NEAR_DHAKA = 'near_dhaka',
}

export enum SettingsSection {
  GENERAL = 'general',
  VENDOR = 'vendor',
  CUSTOMER = 'customer',
  ORDER = 'order',
  WITHDRAW_METHODS = 'withdraw_methods',
  SHIPPING = 'shipping',
  ANALYTICS = 'analytics',
}

export enum ActivityAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  GET = 'get',
}

export enum ResourceType {
  PRODUCT = 'product',
  COMBO_PRODUCT = 'combo_product',
  VENDOR_PRODUCT = 'vendor_product',
  VENDOR_COMBO_PRODUCT = 'vendor_combo_product',
  PRODUCT_REQUEST = 'product_request',
  REFUND = 'refund',
  CATEGORY = 'category',
  BRAND = 'brand',
  SELLER = 'seller',
  CUSTOMER = 'customer',
  ORDER = 'order',
  REVIEW = 'review',
  OFFER = 'offer',
  BANNER = 'banner',
  ANNOUNCEMENT = 'announcement',
  INHOUSE = 'inhouse',
  BUSINESS_SETTINGS = 'business_settings',
  SETTINGS = 'settings',
  LANDING_SECTION = 'landing_section',
}

export enum AdminType {
  ADMIN = 'admin',
  MANAGER = 'manager',
}
