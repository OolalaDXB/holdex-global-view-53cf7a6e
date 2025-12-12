-- Add area_unit preference column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS area_unit TEXT DEFAULT 'sqm';