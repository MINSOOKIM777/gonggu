export type Role = "customer" | "supplier" | "influencer";

export type Profile = {
  id: string;
  role: Role;
  name: string;
  phone: string | null;
  created_at: string;
};

export type Supplier = {
  id: string;
  business_name: string;
  business_number: string | null;
  settlement_bank: string | null;
  settlement_account: string | null;
  created_at: string;
};

export type Influencer = {
  id: string;
  handle: string;
  bio: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  blog_url: string | null;
  other_url: string | null;
  settlement_bank: string | null;
  settlement_account: string | null;
  created_at: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
};

export type Product = {
  id: string;
  supplier_id: string;
  category_id: number | null;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  image_url: string | null;
  image_urls: string[];
  commission_rate: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export type ApplicationStatus = "pending" | "approved" | "rejected";

export type GroupBuyApplication = {
  id: number;
  influencer_id: string;
  product_id: string;
  message: string | null;
  status: ApplicationStatus;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type GroupBuyStatus = "open" | "closed" | "success" | "failed" | "cancelled";

export type GroupBuy = {
  id: string;
  application_id: number | null;
  influencer_id: string;
  product_id: string;
  title: string;
  description: string | null;
  group_price: number;
  target_quantity: number;
  max_per_user: number;
  start_at: string;
  end_at: string;
  status: GroupBuyStatus;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ShippingAddress = {
  id: number;
  customer_id: string;
  recipient_name: string;
  recipient_phone: string;
  address: string;
  address_detail: string | null;
  is_default: boolean;
  created_at: string;
};

export type OrderStatus = "pending" | "paid" | "cancelled" | "failed";
export type DeliveryStatus = "ready" | "shipped" | "delivered" | "cancelled";
export type CancelledBy = "customer" | "supplier" | "system";

export type Order = {
  id: string;
  customer_id: string;
  group_buy_id: string | null;
  toss_order_id: string;
  toss_payment_key: string | null;
  status: OrderStatus;
  total_amount: number;
  commission_total: number;
  recipient_name: string;
  recipient_phone: string;
  address: string;
  address_detail: string | null;
  created_at: string;
  paid_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  cancelled_by: "customer" | "supplier" | "system" | null;
};

export type OrderItem = {
  id: number;
  order_id: string;
  group_buy_id: string | null;
  product_id: string;
  supplier_id: string;
  influencer_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  commission_rate: number;
  commission_amount: number;
  subtotal: number;
  delivery_status: DeliveryStatus;
  shipped_at: string | null;
  delivered_at: string | null;
};

export type Settlement = {
  id: number;
  beneficiary_id: string;
  beneficiary_type: "supplier" | "influencer";
  order_id: string;
  order_item_id: number;
  gross_amount: number;
  commission_amount: number;
  payout_amount: number;
  status: "pending" | "paid";
  created_at: string;
  paid_at: string | null;
};
