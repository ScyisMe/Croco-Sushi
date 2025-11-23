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
  price?: string;
  is_available: boolean;
  is_new: boolean;
  is_popular: boolean;
  position: number;
  sizes?: ProductSize[];
  created_at: string;
}

export interface ProductSize {
  id: number;
  product_id: number;
  name: string;
  price: string;
  weight?: string;
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
  discount_value: string;
  start_date?: string;
  end_date?: string;
  is_available?: boolean;
  conditions?: string;
  meta_description?: string;
}

// Order types
export interface Order {
  id: number;
  order_number: string;
  user_id?: number;
  status: string;
  total_amount: string;
  delivery_cost: string;
  items: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id?: number;
  product_name: string;
  quantity: number;
  price: string;
  size_id?: number;
  size_name?: string;
}

// Review types
export interface ReviewWithUser {
  id: number;
  rating: number;
  comment: string;
  user_name?: string;
  user_phone?: string;
  reply_text?: string;
  reply_date?: string;
  created_at: string;
}

// Order tracking types
export interface OrderTrackResponse {
  order_number: string;
  status: string;
  updated_at: string;
  estimated_delivery_time?: string;
  comment?: string;
  status_history?: Array<{
    status: string;
    changed_at: string;
    comment?: string;
  }>;
}

// Cart types
export interface CartItem {
  product: Product;
  size: ProductSize;
  quantity: number;
}

