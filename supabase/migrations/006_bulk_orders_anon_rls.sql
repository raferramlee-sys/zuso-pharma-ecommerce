-- Fix: bulk_orders RLS was swept into is_super_admin()-only policy by the CMS
-- migration 20261022080000_p0_audit_fasa_d_open_write.sql. The pharma app uses
-- custom seller auth (sellers + seller_sessions, anon key) — inserts/reads/
-- updates from the seller dashboard were rejected ("new row violates RLS").
-- Restore scoped anon access mirroring sellers/seller_sessions/products.

DROP POLICY IF EXISTS "allow_all_on_bulk_orders" ON public.bulk_orders;
DROP POLICY IF EXISTS "anon_insert_bulk_orders" ON public.bulk_orders;
DROP POLICY IF EXISTS "anon_select_bulk_orders" ON public.bulk_orders;
DROP POLICY IF EXISTS "anon_update_bulk_orders" ON public.bulk_orders;

-- anon INSERT: only fresh orders, always pending_payment (no status forgery)
CREATE POLICY "anon_insert_bulk_orders" ON public.bulk_orders
  FOR INSERT TO public
  WITH CHECK (status = 'pending_payment');

-- anon SELECT: public read (app filters by seller_id client-side)
CREATE POLICY "anon_select_bulk_orders" ON public.bulk_orders
  FOR SELECT TO public
  USING (true);

-- anon UPDATE: receipt upload / status transitions
CREATE POLICY "anon_update_bulk_orders" ON public.bulk_orders
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);
