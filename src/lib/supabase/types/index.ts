export interface Product {
  id: string;
  handle: string;
  name: string;
  description: string | null;
  short_description: string | null;
  price: number;
  currency_code: string;
  image_url: string | null;
  images: string[] | null;
  stock_count: number;
  manage_inventory: boolean;
  metadata: Record<string, unknown> | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  parent_category_id: string | null;
  created_at: string;
}

export interface Collection {
  id: string;
  title: string;
  handle: string;
  created_at: string;
}

export interface Cart {
  id: string;
  user_id: string | null;
  created_at: string;
  items?: CartItem[];
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  display_id: number;
  customer_email: string;
  total_amount: number;
  currency_code: string;
  status: 'pending' | 'paid' | 'failed' | 'shipped' | 'cancelled';
  payu_txn_id: string | null;
  shipping_address: Record<string, unknown> | null;
  billing_address: Record<string, unknown> | null;
  shipping_method: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product_name: string;
  created_at: string;
}

export interface CustomerProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
}