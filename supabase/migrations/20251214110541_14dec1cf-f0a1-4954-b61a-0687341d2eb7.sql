-- Add avatar_url to entities table
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS avatar_url TEXT;