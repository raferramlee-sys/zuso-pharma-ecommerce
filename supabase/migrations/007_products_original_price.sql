-- Optional pre-discount price, shown struck through next to price_myr on the storefront
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price_myr numeric;
COMMENT ON COLUMN public.products.original_price_myr IS 'Pre-discount price shown struck through when higher than price_myr';
