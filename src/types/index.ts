export interface Product {
  id: string
  slug: string
  brand: 'atheryx' | 'elysion'
  name: string
  peptide: string
  dosage_mg: number
  doses_per_pen: number
  per_dose_mg: number
  volume_ml: string
  price_myr: number
  description: string
  features: string[]
  images: string[]
  lot: string
  exp: string
  mal_number: string
  fda_approved: boolean
  stock: number
  active: boolean
  is_ezipen?: boolean
  display_name?: string
  created_at?: string
}

export interface CartItem {
  productId: string
  slug: string
  brand: string
  name: string
  peptide: string
  dosage_mg: number
  price_myr: number
  quantity: number
  image?: string
}

export interface Order {
  id: string
  user_id?: string
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  total_myr: number
  stripe_session_id: string
  items: OrderItem[]
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price_myr: number
}

// ─── Seller Affiliate Types ────────────────────────────

export type OrderStatus = 'ordered' | 'paid' | 'preparing_order' | 'delivery' | 'delivered'

export interface Seller {
  id: string
  email: string
  password_hash?: string
  phone: string
  address: string
  bank_name: string
  bank_acc_number: string
  seller_code: string
  discount_pct: number
  commission_pct: number
  is_admin: boolean
  is_active: boolean
  created_at: string
}

export interface PharmaOrder {
  id: string
  seller_code: string
  patient_name: string
  patient_email: string
  patient_phone: string
  patient_address: string
  items: CartItem[]
  subtotal_myr: number
  discount_pct: number
  discount_myr: number
  total_myr: number
  commission_pct: number
  commission_myr: number
  status: OrderStatus
  payment_receipt_url: string | null
  created_at: string
  updated_at: string
}

export interface SellerSession {
  id: string
  seller_id: string
  token: string
  expires_at: string
  created_at: string
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  ordered: 'Ordered',
  paid: 'Paid',
  preparing_order: 'Preparing Order',
  delivery: 'Delivery',
  delivered: 'Delivered',
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'ordered',
  'paid',
  'preparing_order',
  'delivery',
  'delivered',
]
