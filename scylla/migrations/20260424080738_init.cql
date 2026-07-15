-- Migration: init
-- Write your CQL here

/* ================= USER ================= */

CREATE TABLE IF NOT EXISTS user (
  id uuid,
  created_at timestamp,
  name text,
  email text,
  phone text,
  role text,
  is_premium boolean,
  PRIMARY KEY (id, created_at)
);

CREATE TABLE IF NOT EXISTS useraddress (
  user_id uuid,
  id uuid,
  label text,
  lat float,
  lng float,
  address_text text,
  is_default boolean,
  PRIMARY KEY (user_id, id)
);

CREATE TABLE IF NOT EXISTS usersubscription (
  user_id uuid,
  start_date timestamp,
  plan_id uuid,
  end_date timestamp,
  savings_to_date float,
  is_auto_renew boolean,
  PRIMARY KEY (user_id, start_date)
);

CREATE TABLE IF NOT EXISTS loyaltycoins (
  user_id uuid,
  transaction_at timestamp,
  points int,
  reason text,
  PRIMARY KEY (user_id, transaction_at)
);

/* ================= STORE ================= */

CREATE TABLE IF NOT EXISTS store (
  id uuid PRIMARY KEY,
  name text,
  type text,
  location text,
  lat float,
  lng float,
  rating float,
  is_open boolean,
  tags list<text>
);

/* ================= PRODUCT ================= */

CREATE TABLE IF NOT EXISTS product (
  id uuid PRIMARY KEY,
  store_id uuid,
  name text,
  price float,
  category text,
  is_available boolean,
  is_veg boolean,
  stock int,
  add_ons map<text, float>
);

/* ================= CART ================= */

CREATE TABLE IF NOT EXISTS cart (
  user_id uuid,
  product_id uuid,
  quantity int,
  added_at timestamp,
  PRIMARY KEY (user_id, product_id)
);

/* ================= ORDER ================= */

CREATE TABLE IF NOT EXISTS "order" (
  id uuid,
  created_at timestamp,
  user_id uuid,
  store_id uuid,
  rider_id uuid,
  status text,
  total_price float,
  delivery_fee float,
  surge_fee float,
  discount_amount float,
  tax_amount float,
  final_amount float,
  payment_status text,
  payment_id uuid,
  otp int,
  address_snapshot text,
  PRIMARY KEY (id, created_at)
);

CREATE TABLE IF NOT EXISTS orderitem (
  order_id uuid,
  product_id uuid,
  quantity int,
  price float,
  PRIMARY KEY (order_id, product_id)
);

CREATE TABLE IF NOT EXISTS orderbyuser (
  user_id uuid,
  created_at timestamp,
  order_id uuid,
  status text,
  store_name text,
  total_amount float,
  PRIMARY KEY (user_id, created_at)
);

/* ================= PAYMENT ================= */

CREATE TABLE IF NOT EXISTS payment (
  id uuid,
  paid_at timestamp,
  order_id uuid,
  user_id uuid,
  amount float,
  method text,
  status text,
  transaction_ref text,
  PRIMARY KEY (id, paid_at)
);

CREATE TABLE IF NOT EXISTS refund (
  id uuid,
  created_at timestamp,
  payment_id uuid,
  order_id uuid,
  amount float,
  reason text,
  status text,
  PRIMARY KEY (id, created_at)
);

/* ================= RIDER ================= */

CREATE TABLE IF NOT EXISTS riderprofile (
  rider_id uuid PRIMARY KEY,
  vehicle_type text,
  rating float,
  total_orders int,
  current_status text
);

CREATE TABLE IF NOT EXISTS riderincentive (
  rider_id uuid,
  date date,
  daily_earnings float,
  trips_completed int,
  incentive_bonus float,
  PRIMARY KEY (rider_id, date)
);

/* ================= TRACKING ================= */

CREATE TABLE IF NOT EXISTS livetracking (
  order_id uuid,
  timestamp timestamp,
  lat float,
  lng float,
  bearing float,
  battery_level int,
  ttl int,
  PRIMARY KEY (order_id, timestamp)
) WITH default_time_to_live = 86400;

CREATE TABLE IF NOT EXISTS ordereta (
  order_id uuid,
  last_updated timestamp,
  current_eta int,
  traffic_level text,
  weather_impact text,
  PRIMARY KEY (order_id, last_updated)
);

/* ================= CHAT ================= */

CREATE TABLE IF NOT EXISTS chatmessage (
  order_id uuid,
  timestamp timestamp,
  sender_id uuid,
  message text,
  msg_type text,
  is_read boolean,
  PRIMARY KEY (order_id, timestamp)
);

CREATE TABLE IF NOT EXISTS quickactionlog (
  order_id uuid,
  timestamp timestamp,
  action_type text,
  PRIMARY KEY (order_id, timestamp)
);

/* ================= PRICING ================= */

CREATE TABLE IF NOT EXISTS surgepricing (
  zone_id text,
  timestamp timestamp,
  multiplier float,
  reason text,
  PRIMARY KEY (zone_id, timestamp)
);

/* ================= INVENTORY ================= */

CREATE TABLE IF NOT EXISTS inventory (
  store_id uuid,
  product_id uuid,
  stock_count int,
  aisle_number text,
  PRIMARY KEY (store_id, product_id)
);

/* ================= FEEDBACK ================= */

CREATE TABLE IF NOT EXISTS review (
  id uuid PRIMARY KEY,
  order_id uuid,
  user_id uuid,
  store_id uuid,
  rating int,
  comment text,
  tags list<text>
);

CREATE TABLE IF NOT EXISTS dispute (
  id uuid PRIMARY KEY,
  order_id uuid,
  user_id uuid,
  issue_type text,
  status text,
  refund_amount float
);