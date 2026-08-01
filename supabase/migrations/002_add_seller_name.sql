-- Add name column to sellers table
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS name TEXT;
-- Backfill name from email prefix for existing rows
UPDATE public.sellers SET name = SPLIT_PART(email, '@', 1) WHERE name IS NULL;
