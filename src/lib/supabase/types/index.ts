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
  thumbnail: string | null;
  images: string[] | null;
  stock_count: number;
  manage_inventory: boolean;
  metadata: Record<string, unknown> | null;
  category_id: string | null;
  collection_id: string | null;
  created_at: string;
  updated_at: string;
  subtitle?: string | null;
  status: 'active' | 'draft' | 'archived';
  variants?: ProductVariant[];
  options?: ProductOption[];
  collection?: Collection | null;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  barcode?: string;
  price: number;
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
}

export interface PaymentCollection {
  payment_sessions: PaymentSession[];
}

export interface Promotion {
  id: string;
  code: string;
  is_automatic: boolean;
  application_method?: {
    type: 'percentage' | 'fixed';
    value: number;
    currency_code: string;
  };
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string;
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
  display_id: number;
  customer_email: string;
  email: string; 
  total_amount: number;
  currency_code: string;
  status: 'pending' | 'paid' | 'failed' | 'shipped' | 'cancelled';
  fulfillment_status: string;
  payment_status: string;
  payu_txn_id: string | null;
  shipping_address: Address | null;
  billing_address: Address | null;
  shipping_method: string | null;
  shipping_methods?: ShippingMethod[];
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
}