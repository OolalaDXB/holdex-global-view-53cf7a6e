-- Add tenure_type for UK real estate
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS tenure_type TEXT CHECK (tenure_type IN ('freehold', 'leasehold', 'share_of_freehold'));

-- Add lease_end_date for leasehold properties
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS lease_end_date DATE;

-- Add liquidity_status with default 'liquid'
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS liquidity_status TEXT DEFAULT 'liquid' CHECK (liquidity_status IN ('liquid', 'restricted', 'frozen', 'blocked'));