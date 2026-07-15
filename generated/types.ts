/* ================= USER ================= */

export interface User {
  id: string;
  created_at: string; // ✅ FIXED (was Date)
  name: string;
  email: string;
  phone: string;
  role: "customer" | "rider" | "admin";
  is_premium: boolean;
}

export interface UserAddress {
  user_id: string;
  id: string;
  label: string;
  lat: number;
  lng: number;
  address_text: string;
  is_default: boolean;
}

export interface UserSubscription {
  user_id: string;
  start_date: Date;
  plan_id: string;
  end_date: Date;
  savings_to_date: number;
  is_auto_renew: boolean;
}

export interface LoyaltyCoins {
  user_id: string;
  transaction_at: Date;
  points: number;
  reason: string;
}

/* ================= STORE ================= */

export interface Store {
  id: string;
  name: string;
  type: string;
  location: string;
  lat: number;
  lng: number;
  rating: number;
  is_open: boolean;
  tags: string[];
}

/* ================= PRODUCT ================= */

export interface Product {
  id: string;
  store_id: string;
  name: string;
  price: number;
  category: string;
  is_available: boolean;
  is_veg: boolean;
  stock: number;
  add_ons: Record<string, number>;
}

/* ================= CART ================= */

export interface Cart {
  created_at: Date;
  user_id: string;
  product_id: string;
  quantity: number;
  added_at: Date;
}

/* ================= ORDER ================= */

export interface Orders {
  id: string;
  created_at: Date;
  user_id: string;
  store_id: string;
  rider_id: string;
  status: string;
  total_price: number;
  delivery_fee: number;
  surge_fee: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  payment_status: string;
  payment_id: string;
  otp: number;
  address_snapshot: string;
}

export interface OrderItem {
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
}

export interface OrderByUser {
  user_id: string;
  created_at: Date;
  order_id: string;
  status: string;
  store_name: string;
  total_amount: number;
}

/* ================= PAYMENT ================= */

export interface Payment {
  id: string;
  paid_at: Date;
  order_id: string;
  user_id: string;
  amount: number;
  method: string;
  status: string;
  transaction_ref: string;
}

export interface Refund {
  id: string;
  created_at: Date;
  payment_id: string;
  order_id: string;
  amount: number;
  reason: string;
  status: string;
}

/* ================= RIDER ================= */

export interface RiderProfile {
  rider_id: string;
  vehicle_type: string;
  rating: number;
  total_orders: number;
  current_status: string;
}

export interface RiderIncentive {
  rider_id: string;
  date: string;
  daily_earnings: number;
  trips_completed: number;
  incentive_bonus: number;
}

/* ================= TRACKING ================= */

export interface LiveTracking {
  order_id: string;
  timestamp: Date;
  lat: number;
  lng: number;
  bearing: number;
  battery_level: number;
  ttl: number;
}

export interface OrderETA {
  order_id: string;
  last_updated: Date;
  current_eta: number;
  traffic_level: string;
  weather_impact: string;
}

/* ================= CHAT ================= */

export interface ChatMessage {
  order_id: string;
  timestamp: Date;
  sender_id: string;
  message: string;
  msg_type: string;
  is_read: boolean;
}

export interface QuickActionLog {
  order_id: string;
  timestamp: Date;
  action_type: string;
}

/* ================= PRICING ================= */

export interface SurgePricing {
  zone_id: string;
  timestamp: Date;
  multiplier: number;
  reason: string;
}

/* ================= INVENTORY ================= */

export interface Inventory {
  store_id: string;
  product_id: string;
  stock_count: number;
  aisle_number: string;
}

/* ================= FEEDBACK ================= */

export interface Review {
  id: string;
  order_id: string;
  user_id: string;
  store_id: string;
  rating: number;
  comment: string;
  tags: string[];
}

export interface Dispute {
  id: string;
  order_id: string;
  user_id: string;
  issue_type: string;
  status: string;
  refund_amount: number;
}