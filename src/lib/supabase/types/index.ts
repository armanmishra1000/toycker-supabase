export interface Product {
  id: string;
  handle: string;
  name: string;
  title: string;
  description: string | null;
  short_description: string | null;
  price: number;
  currency_code: string;
  image_url: string | null;
  video_url?: string | null;
  thumbnail: string | null;
  images: (string | ProductImage)[] | null;
  stock_count: number;
  manage_inventory: boolean;
  metadata: Record<string, unknown> | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_metadata: Record<string, unknown> | null;
  category_id: string | null;
  collection_id: string | null;
  created_at: string;
  updated_at: string;
  subtitle?: string | null;
  status: 'active' | 'draft' | 'archived';
  variants?: ProductVariant[];
  options?: ProductOption[];
  collection?: Collection | null;
  collections?: Collection[];
  categories?: Category[];
  related_combinations?: {
    id: string;
    product_id: string;
    related_product_id: string;
    related_product: Product;
  }[];
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  barcode?: string;
  price: number;
  compare_at_price?: number | null;
  original_price?: number;
  inventory_quantity: number;
  manage_inventory: boolean;
  allow_backorder: boolean;
  product_id: string;
  options: ProductOptionValue[];
  calculated_price?: {
    calculated_amount: number;
    original_amount: number;
    currency_code: string;
    price_type: string;
  };
  prices?: Price[];
  product?: Product;
  image_url?: string | null;
}

export interface VariantFormData {
  id?: string;
  title: string;
  sku: string;
  price: number;
  compare_at_price?: number | null;
  inventory_quantity: number;
  image_url?: string | null;
}

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductOption {
  id: string;
  title: string;
  values: ProductOptionValue[];
}

export interface ProductOptionValue {
  id: string;
  value: string;
  option_id?: string;
  metadata?: Record<string, unknown>;
}

export interface Price {
  amount: number;
  currency_code: string;
  price_rules?: PriceRule[];
}

export interface PriceRule {
  attribute: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  value: string;
}

export interface Category {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  parent_category_id: string | null;
  created_at: string;
  category_children?: Category[];
  parent_category?: Category;
}


export interface Collection {
  id: string;
  title: string;
  handle: string;
  created_at: string;
  products?: Product[];
}

export interface Cart {
  id: string;
  user_id: string | null;
  email?: string;
  region_id?: string;
  currency_code: string;
  created_at: string;
  updated_at?: string;
  items?: CartItem[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  shipping_methods?: ShippingMethod[];
  payment_collection?: PaymentCollection | null;
  shipping_method?: string | null;
  // Totals
  subtotal?: number;
  total?: number;
  tax_total?: number;
  discount_total?: number;
  shipping_total?: number;
  item_total?: number;
  gift_card_total?: number;
  shipping_subtotal?: number;
  item_subtotal?: number;
  discount_subtotal?: number;
  original_total?: number;
  original_tax_total?: number;
  original_item_total?: number;
  region?: Region;
  promotions?: Promotion[];
  // Club membership
  club_savings?: number;
  is_club_member?: boolean;
  club_discount_percentage?: number;
  // Rewards
  rewards_to_apply?: number;
  rewards_discount?: number;
  available_rewards?: number;
  free_shipping_threshold?: number;
  payment_discount?: number;
  payment_discount_percentage?: number;
}

export interface PaymentCollection {
  payment_sessions: PaymentSession[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  provider_id: string;
  amount: number;
  data?: {
    card_last4?: string;
    [key: string]: unknown;
  };
  created_at?: string;
}

export interface Promotion {
  id: string
  code: string
  type: "percentage" | "fixed" | "free_shipping"
  value: number
  min_order_amount: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  max_uses: number | null
  used_count: number
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
  variant?: ProductVariant;
  title: string;
  product_title: string;
  product_handle?: string;
  thumbnail?: string;
  unit_price: number;
  total: number;
  subtotal?: number;
  original_total?: number;
  original_unit_price?: number;
  has_club_discount?: boolean;
  metadata?: Record<string, unknown>;
}

export interface Address {
  id?: string;
  first_name: string | null;
  last_name: string | null;
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  country_code: string | null;
  province: string | null;
  postal_code: string | null;
  phone: string | null;
  company: string | null;
}

export interface Order {
  id: string;
  user_id?: string | null;
  display_id: number;
  customer_email: string;
  email: string;
  total_amount: number;
  currency_code: string;
  status: 'pending' | 'order_placed' | 'accepted' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
  fulfillment_status: string;
  payment_status: string;
  payu_txn_id: string | null;
  shipping_address: Address | null;
  billing_address: Address | null;
  shipping_method: string | null;
  shipping_methods?: ShippingMethod[];
  shipping_partner_id?: string | null;
  shipping_partner?: ShippingPartner | null;
  tracking_number?: string | null;
  payment_method?: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  items?: CartItem[];
  total: number;
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  discount_total: number;
  gift_card_total: number;
  payment_collections?: PaymentCollection[];
}

export interface Region {
  id: string;
  name: string;
  currency_code: string;
  countries: { id: string; iso_2: string; display_name: string }[];
}

export interface ShippingMethod {
  id: string;
  name: string;
  amount: number;
  price_type: 'flat' | 'calculated';
  total?: number;
  subtotal?: number;
  shipping_option_id?: string;
  min_order_free_shipping?: number | null;
}

export interface ShippingOption {
  id: string;
  name: string;
  amount: number;
  price_type: 'flat' | 'calculated';
  prices: Price[];
  calculated_price?: {
    calculated_amount: number;
    original_amount: number;
  };
  service_zone?: {
    fulfillment_set?: {
      type?: string;
      location?: { address?: Address };
    };
  };
  is_active?: boolean;
  insufficient_inventory?: boolean;
  min_order_free_shipping?: number | null;
}

export interface PaymentSession {
  id: string;
  provider_id: string;
  amount: number;
  status: 'pending' | 'authorized' | 'completed' | 'canceled' | 'requires_action';
  data: Record<string, unknown>;
}

export interface CustomerProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  addresses: Address[];
  is_club_member?: boolean;
  club_member_since?: string | null;
  total_club_savings?: number;
  customer_display_id?: number | null;
}

export interface PaymentProvider {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  discount_percentage?: number;
  created_at: string;
}

export interface ClubSettings {
  id: string;
  min_purchase_amount: number;
  discount_percentage: number;
  rewards_percentage: number;
  is_active: boolean;
  updated_at: string;
}

export interface RewardWallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface RewardTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: 'earned' | 'spent';
  description: string;
  order_id: string | null;
  created_at: string;
}

export interface RewardTransactionWithOrder extends RewardTransaction {
  orders: {
    display_id: number;
  } | null;
}

export type OrderEventType =
  | 'order_placed'
  | 'payment_pending'
  | 'payment_captured'
  | 'payment_failed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'note_added';

export interface OrderTimeline {
  id: string;
  order_id: string;
  event_type: OrderEventType;
  title: string;
  description: string | null;
  actor: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ShippingPartner {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminRole {
  id: string;
  name: string;
  permissions: string[];
  is_system: boolean;
  created_at: string;
}

export interface StaffMember {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  admin_role_id: string | null;
  admin_role?: AdminRole[] | AdminRole | null;
  created_at: string;
}

export interface GlobalSettings {
  id: string;
  gift_wrap_fee: number;
  is_gift_wrap_enabled: boolean;
  updated_at: string;
}