-- Add CHECK constraint for ownership_percentage between 0 and 100 on assets
ALTER TABLE public.assets
ADD CONSTRAINT assets_ownership_percentage_range 
CHECK (ownership_percentage IS NULL OR (ownership_percentage >= 0 AND ownership_percentage <= 100));

-- Add CHECK constraint for ownership_percentage between 0 and 100 on collections (need to add column first if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'ownership_percentage') THEN
    ALTER TABLE public.collections ADD COLUMN ownership_percentage numeric DEFAULT 100;
  END IF;
END $$;

ALTER TABLE public.collections
ADD CONSTRAINT collections_ownership_percentage_range 
CHECK (ownership_percentage IS NULL OR (ownership_percentage >= 0 AND ownership_percentage <= 100));

-- Add CHECK constraint on currency fields for valid ISO currency codes
ALTER TABLE public.assets
ADD CONSTRAINT assets_currency_valid 
CHECK (currency IN ('EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB', 'JPY', 'CNY', 'INR', 'SGD', 'HKD', 'CAD', 'AUD', 'NZD', 'ZAR', 'BRL', 'MXN', 'KRW', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'PLN', 'CZK', 'HUF', 'SEK', 'NOK', 'DKK', 'ILS', 'TRY', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'EGP', 'MAD', 'NGN', 'KES', 'BWP'));

ALTER TABLE public.collections
ADD CONSTRAINT collections_currency_valid 
CHECK (currency IN ('EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB', 'JPY', 'CNY', 'INR', 'SGD', 'HKD', 'CAD', 'AUD', 'NZD', 'ZAR', 'BRL', 'MXN', 'KRW', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'PLN', 'CZK', 'HUF', 'SEK', 'NOK', 'DKK', 'ILS', 'TRY', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'EGP', 'MAD', 'NGN', 'KES', 'BWP'));

ALTER TABLE public.liabilities
ADD CONSTRAINT liabilities_currency_valid 
CHECK (currency IN ('EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB', 'JPY', 'CNY', 'INR', 'SGD', 'HKD', 'CAD', 'AUD', 'NZD', 'ZAR', 'BRL', 'MXN', 'KRW', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'PLN', 'CZK', 'HUF', 'SEK', 'NOK', 'DKK', 'ILS', 'TRY', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'EGP', 'MAD', 'NGN', 'KES', 'BWP'));

ALTER TABLE public.receivables
ADD CONSTRAINT receivables_currency_valid 
CHECK (currency IN ('EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB', 'JPY', 'CNY', 'INR', 'SGD', 'HKD', 'CAD', 'AUD', 'NZD', 'ZAR', 'BRL', 'MXN', 'KRW', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'PLN', 'CZK', 'HUF', 'SEK', 'NOK', 'DKK', 'ILS', 'TRY', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'EGP', 'MAD', 'NGN', 'KES', 'BWP'));

-- Add CHECK constraint on country fields for valid ISO country codes (2-letter)
ALTER TABLE public.assets
ADD CONSTRAINT assets_country_valid 
CHECK (country ~ '^[A-Z]{2}$');

ALTER TABLE public.collections
ADD CONSTRAINT collections_country_valid 
CHECK (country ~ '^[A-Z]{2}$');

ALTER TABLE public.liabilities
ADD CONSTRAINT liabilities_country_valid 
CHECK (country ~ '^[A-Z]{2}$');

-- Ensure current_balance on liabilities cannot be negative
ALTER TABLE public.liabilities
ADD CONSTRAINT liabilities_balance_non_negative 
CHECK (current_balance >= 0);

-- Ensure loan interest_rate is between 0 and 100
ALTER TABLE public.liabilities
ADD CONSTRAINT liabilities_interest_rate_range 
CHECK (interest_rate IS NULL OR (interest_rate >= 0 AND interest_rate <= 100));

ALTER TABLE public.loan_schedules
ADD CONSTRAINT loan_schedules_interest_rate_range 
CHECK (interest_rate IS NULL OR (interest_rate >= 0 AND interest_rate <= 100));

-- Create function to validate ownership_allocation total doesn't exceed 100%
CREATE OR REPLACE FUNCTION public.validate_ownership_allocation(allocation jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  total_percentage numeric := 0;
  item jsonb;
BEGIN
  IF allocation IS NULL THEN
    RETURN true;
  END IF;
  
  FOR item IN SELECT * FROM jsonb_array_elements(allocation)
  LOOP
    total_percentage := total_percentage + COALESCE((item->>'percentage')::numeric, 0);
  END LOOP;
  
  RETURN total_percentage <= 100;
END;
$$;

-- Add constraint to prevent total ownership_allocation percentages exceeding 100%
ALTER TABLE public.assets
ADD CONSTRAINT assets_ownership_allocation_valid 
CHECK (public.validate_ownership_allocation(ownership_allocation));

ALTER TABLE public.collections
ADD CONSTRAINT collections_ownership_allocation_valid 
CHECK (public.validate_ownership_allocation(ownership_allocation));

-- Add DELETE policy on net_worth_history so users can delete their own snapshots
CREATE POLICY "Users can delete own history"
ON public.net_worth_history
FOR DELETE
USING (user_id = auth.uid());