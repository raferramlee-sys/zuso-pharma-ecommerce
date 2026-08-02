-- Bulk Orders for Seller Stock Replenishment
-- Seller orders pens at cost price (retail - discount% - commission%)
-- Admin fulfills delivery and stock is auto-decremented

CREATE TABLE IF NOT EXISTS public.bulk_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  seller_code TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_cost_myr INTEGER NOT NULL DEFAULT 0,
  total_retail_myr INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'paid', 'preparing', 'delivered', 'cancelled')),
  payment_receipt_url TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for seller lookups
CREATE INDEX IF NOT EXISTS idx_bulk_orders_seller_id ON public.bulk_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_seller_code ON public.bulk_orders(seller_code);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_status ON public.bulk_orders(status);

-- Enable RLS
ALTER TABLE public.bulk_orders ENABLE ROW LEVEL SECURITY;

-- RLS: Allow all operations (anon key used by frontend with custom auth)
-- The API layer handles authorization via session tokens
CREATE POLICY "Allow all on bulk_orders" ON public.bulk_orders
  FOR ALL USING (true) WITH CHECK (true);
