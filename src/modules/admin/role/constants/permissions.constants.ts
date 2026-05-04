export enum PERMISSIONS {
  ALL = 'all',

  DASHBOARD = 'dashboard',

  // ── Product Management
  PRODUCT_MANAGEMENT = 'product_management', // full module
  PRODUCT_CATEGORIES = 'product_categories',
  PRODUCT_BRAND = 'product_brand',
  PRODUCT_ATTRIBUTES = 'product_attributes',
  PRODUCT_BENEFIT_SETUP = 'product_benefit_setup',
  INHOUSE_PRODUCTS = 'inhouse_products',
  VENDOR_PRODUCTS = 'vendor_products',
  COMBO_OFFER = 'combo_offer',
  COMBO_BANNER = 'combo_banner',
  DAMAGE_PRODUCT = 'damage_product',

  REQUEST_RESTOCK = 'request_restock',
  PRODUCT_UPDATE_REQUEST = 'product_update_request',

  // ── User Management
  USER_MANAGEMENT = 'user_management', // full module
  USER_VENDOR = 'user_vendor',
  USER_CUSTOMER = 'user_customer',
  USER_MANAGER = 'user_manager',

  // ── Order Management
  ORDER_MANAGEMENT = 'order_management', // full module
  ORDER = 'order',
  // REFUND_REQUEST = 'refund_request',
  //---Refund Management
  REFUND_MANAGEMENT = 'refund_management',
  REFUND_REQUEST = 'refund_request',

  // ── Standalone modules
  PRODUCT_REVIEW = 'product_review',
  OFFERS_AND_DEALS = 'offers_and_deals',
  BANNER_SETUP = 'banner_setup',
  USER_ROLE_SETUP = 'user_role_setup',
  ANNOUNCEMENT_SETUP = 'announcement_setup',
  HELP_AND_SUPPORT = 'help_and_support',
  BUSINESS_SETTINGS = 'business_settings',
  INHOUSE_SHOP = 'inhouse_shop',
  SETTINGS = 'settings',
  CONTACTS = 'contacts',
}
