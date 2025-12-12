-- Add platform field for crypto assets
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS platform TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.assets.platform IS 'Platform/exchange for crypto assets (e.g., Ledger, Binance, Coinbase)';