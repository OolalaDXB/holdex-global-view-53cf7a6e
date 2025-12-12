-- Add secondary currency columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS secondary_currency_1 TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS secondary_currency_2 TEXT DEFAULT 'AED';

-- Add exchange_rates_snapshot and crypto_prices_snapshot columns to net_worth_history
ALTER TABLE public.net_worth_history 
ADD COLUMN IF NOT EXISTS exchange_rates_snapshot JSONB,
ADD COLUMN IF NOT EXISTS crypto_prices_snapshot JSONB;