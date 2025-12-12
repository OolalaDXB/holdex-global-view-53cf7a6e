-- Add user preferences columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_cities JSONB DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dashboard_widgets JSONB DEFAULT '["net_worth", "chart", "breakdown_type", "breakdown_country", "breakdown_currency", "leasehold_reminders", "expiring_documents"]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blur_amounts BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fiscal_year_start TEXT DEFAULT '01-01';