-- Pre-screening questionnaire for WhatsApp leads
CREATE TABLE IF NOT EXISTS public.pre_screening (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  age INTEGER,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  email TEXT,
  co_morbids TEXT[] DEFAULT '{}',
  co_morbids_other TEXT,
  family_thyroid BOOLEAN,
  steps_per_day INTEGER,
  seller_code TEXT
);

ALTER TABLE public.pre_screening ENABLE ROW LEVEL SECURITY;

-- Anyone can submit pre-screening (public form)
CREATE POLICY "Allow anon insert pre_screening" ON public.pre_screening
  FOR INSERT WITH CHECK (true);
