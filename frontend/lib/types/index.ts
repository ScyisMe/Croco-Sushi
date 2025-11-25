// Common types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// User types
export interface User {
  id: number;
  phone: string;
  email?: string;
  name?: string;
  is_active: boolean;
  is_admin: boolean;
  newsletter_subscription: boolean;
  bonus_balance: number;
  loyalty_status: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Product types
export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  category_id?: number;
  image_url?: string;
  images?: string[];
  price: number;
  original_price?: number;
  is_available: boolean;
  is_new: boolean;
  is_popular: boolean;
  is_hit: boolean;
  is_promotion: boolean;
  position: number;
  sizes?: ProductSize[];
  calories?: number;
  weight?: string;
  created_at: string;
}

export interface ProductSize {
  id: number;
  product_id: number;
  name: string;
  price: number;
  original_price?: number;
  weight?: string;
  is_default?: boolean;
}

// Category types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  position: number;
  is_active: boolean;
}

// Promotion types
export interface Promotion {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  discount_percent?: number;
  start_date?: string;
  end_date?: string;
  is_available?: boolean;
  is_active?: boolean;
  conditions?: string;
  min_order_amount?: number;
  max_uses?: number;
  current_uses?: number;
  meta_description?: string;
}

// Order types
export interface Order {
  id: number;
  order_number: string;
  user_id?: number;
  status: OrderStatus;
  total_amount: number;
  delivery_cost: number;
  discount_amount?: number;
  items: OrderItem[];
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_street?: string;
  delivery_building?: string;
  delivery_apartment?: string;
  comment?: string;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  created_at: string;
  updated_at?: string;
}

export type OrderStatus = 
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivering"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cash" | "card_online" | "card_courier";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItem {
  id: number;
  product_id?: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  size_id?: number;
  size_name?: string;
}

// Review types
export interface Review {
  id: number;
  rating: number;
  comment: string;
  user_id?: number;
  user_name?: string;
  user_phone?: string;
  product_id?: number;
  order_id?: number;
  images?: string[];
  is_published: boolean;
  reply_text?: string;
  reply_date?: string;
  created_at: string;
}

export interface ReviewWithUser extends Review {
  user?: User;
}

// Order tracking types
export interface OrderTrackResponse {
  order_number: string;
  status: OrderStatus;
  updated_at: string;
  estimated_delivery_time?: string;
  comment?: string;
  status_history?: StatusHistoryItem[];
}

export interface StatusHistoryItem {
  status: OrderStatus;
  changed_at: string;
  comment?: string;
}

// Cart types
export interface CartItem {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  size?: string;
  quantity: number;
}

// Address types
export interface Address {
  id: number;
  user_id: number;
  city: string;
  street: string;
  building: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  comment?: string;
  is_default: boolean;
  created_at: string;
}

// Delivery zone types
export interface DeliveryZone {
  id: number;
  name: string;
  min_order_amount: number;
  delivery_cost: number;
  free_delivery_from?: number;
  is_active: boolean;
}

// Callback request
export interface CallbackRequest {
  phone: string;
  name?: string;
}

// Promo code types
export interface PromoCode {
  id: number;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount?: number;
  max_uses?: number;
  current_uses: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

// Loyalty types
export interface LoyaltyInfo {
  bonus_balance: number;
  loyalty_status: "new" | "silver" | "gold";
  total_orders: number;
  total_spent: number;
  referral_code?: string;
}

export interface LoyaltyHistoryItem {
  id: number;
  amount: number;
  type: "earned" | "spent" | "expired";
  description: string;
  order_id?: number;
  created_at: string;
}

// Favorite types
export interface Favorite {
  id: number;
  user_id: number;
  product_id: number;
  product?: Product;
  created_at: string;
}

// Settings types
export interface PublicSettings {
  site_name: string;
  phones: string[];
  email: string;
  address: string;
  working_hours: {
    weekdays: string;
    weekend: string;
  };
  min_order_amount: number;
  delivery_cost: number;
  free_delivery_from: number;
  social_links?: {
    instagram?: string;
    facebook?: string;
    telegram?: string;
    tiktok?: string;
  };
}
