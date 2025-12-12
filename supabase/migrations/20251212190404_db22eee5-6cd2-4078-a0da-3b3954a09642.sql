-- Add news_sources column to profiles table for storing user's preferred news sources
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS news_sources JSONB DEFAULT '["bloomberg", "reuters"]'::jsonb;