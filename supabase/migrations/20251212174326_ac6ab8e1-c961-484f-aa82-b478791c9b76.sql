-- Remove the base_currency check constraint that limits allowed currencies
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_base_currency_check;

-- Also remove any similar constraints on secondary currencies if they exist
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_secondary_currency_1_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_secondary_currency_2_check;