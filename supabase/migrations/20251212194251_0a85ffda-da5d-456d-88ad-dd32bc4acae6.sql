-- Add location fields for real estate assets
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7);
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7);