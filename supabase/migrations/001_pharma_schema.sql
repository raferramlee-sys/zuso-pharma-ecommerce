-- Pharma Ecommerce Schema
-- Creates tables for products, orders, and cart sessions

-- Products table
CREATE TABLE IF NOT EXISTS public.pharma_products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL CHECK (brand IN ('atheryx', 'elysion')),
  name TEXT NOT NULL,
  peptide TEXT NOT NULL,
  dosage_mg INTEGER NOT NULL,
  doses_per_pen INTEGER NOT NULL DEFAULT 5,
  volume_ml TEXT NOT NULL DEFAULT '0.6 mL',
  price_myr INTEGER NOT NULL,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  lot TEXT,
  exp TEXT,
  mal_number TEXT DEFAULT 'MAL23056078XZ',
  fda_approved BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 100,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.pharma_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total_myr INTEGER NOT NULL,
  stripe_session_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  shipping_address JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS public.pharma_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.pharma_orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_myr INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cart sessions table (persistent anonymous carts)
CREATE TABLE IF NOT EXISTS public.pharma_cart_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, product_id)
);

-- Seed products
INSERT INTO public.pharma_products (id, slug, brand, name, peptide, dosage_mg, doses_per_pen, price_myr, description, features, lot, exp) VALUES
  ('ath-30', 'atheryx-retatrutide-30mg', 'atheryx', 'ATHERYX™ Retatrutide', 'Retatrutide Injection', 30, 5, 899,
   'Advanced triple-agonist peptide therapy targeting GLP-1, GIP, and glucagon receptors.',
   ARRAY['Triple-agonist mechanism (GLP-1/GIP/Glucagon)', 'Precise multi-dose pen delivery', 'Research-backed peptide formulation', 'Premium pharmaceutical grade', 'FDA Approved', 'Sterile A — Rx Only'],
   'ATH250701', '2028-07'),
  ('ath-15', 'atheryx-retatrutide-15mg', 'atheryx', 'ATHERYX™ Retatrutide', 'Retatrutide Injection', 15, 5, 599,
   'Entry-level triple-agonist peptide therapy with the same advanced mechanism in a starter dosage.',
   ARRAY['Triple-agonist mechanism (GLP-1/GIP/Glucagon)', 'Starter dosage for new patients', 'Precise multi-dose pen delivery', 'Research-backed peptide formulation', 'FDA Approved', 'Sterile A — Rx Only'],
   'ATH250701', '2028-07'),
  ('ely-30', 'elysion-tirzepatide-30mg', 'elysion', 'ELYISION™ Tirzepatide', 'Tirzepatide Injection', 30, 5, 799,
   'Dual GIP/GLP-1 receptor agonist for powerful glycemic control and weight management.',
   ARRAY['Dual-agonist mechanism (GIP/GLP-1)', 'Clinically proven weight management', 'Precise multi-dose pen delivery', 'Premium pharmaceutical grade', 'FDA Approved', 'Sterile A — Rx Only'],
   'ELY250701', '2028-07'),
  ('ely-25', 'elysion-tirzepatide-25mg', 'elysion', 'ELYISION™ Tirzepatide', 'Tirzepatide Injection', 25, 5, 649,
   'Starter dosage of the clinically proven dual-agonist peptide.',
   ARRAY['Dual-agonist mechanism (GIP/GLP-1)', 'Starter dosage for new patients', 'Precise multi-dose pen delivery', 'Clinically proven results', 'FDA Approved', 'Sterile A — Rx Only'],
   'ELY250701', '2028-07')
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  brand = EXCLUDED.brand,
  name = EXCLUDED.name,
  peptide = EXCLUDED.peptide,
  dosage_mg = EXCLUDED.dosage_mg,
  doses_per_pen = EXCLUDED.doses_per_pen,
  price_myr = EXCLUDED.price_myr,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  updated_at = now();

-- Enable RLS
ALTER TABLE public.pharma_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharma_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharma_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharma_cart_sessions ENABLE ROW LEVEL SECURITY;

-- RLS: Products readable by all
CREATE POLICY "Products are viewable by everyone" ON public.pharma_products
  FOR SELECT USING (active = true);

-- RLS: Orders visible to owner or service_role
CREATE POLICY "Users can view own orders" ON public.pharma_orders
  FOR SELECT USING (auth.uid() = user_id);

-- RLS: Order items visible to order owner
CREATE POLICY "Users can view own order items" ON public.pharma_order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pharma_orders WHERE id = order_id AND user_id = auth.uid())
  );

-- RLS: Cart sessions - anon can insert/update/delete own session
CREATE POLICY "Anon can manage own cart" ON public.pharma_cart_sessions
  FOR ALL USING (true) WITH CHECK (true);
