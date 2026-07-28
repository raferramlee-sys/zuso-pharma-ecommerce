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
