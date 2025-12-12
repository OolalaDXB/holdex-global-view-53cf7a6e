-- Add monthly_income field to profiles for debt-to-income calculation
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_income numeric DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_income_currency text DEFAULT 'EUR';