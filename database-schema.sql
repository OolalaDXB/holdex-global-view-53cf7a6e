-- =====================================================
-- VERSO DATABASE SCHEMA - PRODUCTION READY
-- Generated: 2025-12-16
-- All security fixes applied
-- =====================================================

-- =====================================================
-- SECTION 1: FUNCTIONS
-- =====================================================

-- Validate ownership allocation percentages
CREATE OR REPLACE FUNCTION public.validate_ownership_allocation(allocation jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
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
$function$;

-- Check for circular ownership in entities
CREATE OR REPLACE FUNCTION public.check_circular_ownership()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_id UUID;
  visited_ids UUID[];
BEGIN
  IF NEW.owned_by_entity_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  current_id := NEW.owned_by_entity_id;
  visited_ids := ARRAY[NEW.id];
  
  WHILE current_id IS NOT NULL LOOP
    IF current_id = ANY(visited_ids) THEN
      RAISE EXCEPTION 'Circular ownership detected';
    END IF;
    visited_ids := array_append(visited_ids, current_id);
    SELECT owned_by_entity_id INTO current_id 
    FROM public.entities 
    WHERE id = current_id 
      AND user_id = NEW.user_id;  -- tenant scope
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Enforce receiver update restrictions on shared_access
CREATE OR REPLACE FUNCTION public.enforce_receiver_update_restrictions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.shared_with_id = auth.uid() AND OLD.owner_id != auth.uid() THEN
    IF NEW.owner_id != OLD.owner_id 
       OR NEW.shared_with_email != OLD.shared_with_email 
       OR NEW.shared_with_id IS DISTINCT FROM OLD.shared_with_id
       OR NEW.created_at != OLD.created_at THEN
      RAISE EXCEPTION 'Receivers can only update the status field';
    END IF;
    
    IF NEW.status NOT IN ('accepted', 'declined') AND NEW.status != OLD.status THEN
      RAISE EXCEPTION 'Receivers can only set status to accepted or declined';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create default entity for new users
CREATE OR REPLACE FUNCTION public.ensure_default_entity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.entities (user_id, name, type, icon, color)
  VALUES (NEW.id, 'Personal', 'personal', '👤', '#C4785A')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$function$;

-- Audit logging function (minimal logging for Zero Knowledge)
CREATE OR REPLACE FUNCTION public.log_audit_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.audit_events (user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (
    COALESCE(auth.uid(), CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END),
    TG_OP,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    jsonb_build_object(
      'changed_at', now(),
      'entity_name', CASE WHEN TG_OP = 'DELETE' THEN OLD.name ELSE NEW.name END
    ),
    now()
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Update receivable balance on payment
CREATE OR REPLACE FUNCTION public.update_receivable_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Invalid payment amount';
  END IF;

  UPDATE public.receivables r
  SET
    current_balance = GREATEST(r.current_balance - NEW.amount, 0),
    last_payment_date = NEW.payment_date,
    last_payment_amount = NEW.amount,
    status = CASE
      WHEN (r.current_balance - NEW.amount) <= 0 THEN 'paid'
      WHEN (r.current_balance - NEW.amount) < r.original_amount THEN 'partial'
      ELSE r.status
    END,
    updated_at = now()
  WHERE r.id = NEW.receivable_id
    AND r.user_id = NEW.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receivable not found or tenant mismatch';
  END IF;

  RETURN NEW;
END;
$function$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- =====================================================
-- SECTION 2: TABLES
-- =====================================================

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  base_currency TEXT DEFAULT 'EUR',
  secondary_currency_1 TEXT DEFAULT 'USD',
  secondary_currency_2 TEXT DEFAULT 'AED',
  dark_mode BOOLEAN DEFAULT true,
  blur_amounts BOOLEAN DEFAULT false,
  area_unit TEXT DEFAULT 'sqm',
  fiscal_year_start TEXT DEFAULT '01-01',
  monthly_income NUMERIC,
  monthly_income_currency TEXT DEFAULT 'EUR',
  compliance_mode TEXT DEFAULT 'none',
  dashboard_widgets JSONB DEFAULT '["net_worth", "chart", "breakdown_type", "breakdown_country", "breakdown_currency", "leasehold_reminders", "expiring_documents"]'::jsonb,
  favorite_cities JSONB DEFAULT '[]'::jsonb,
  news_sources JSONB DEFAULT '["bloomberg", "reuters"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT profiles_compliance_mode_check CHECK (compliance_mode = ANY (ARRAY['none', 'islamic', 'jewish', 'hindu', 'all']))
);

-- Entities table
CREATE TABLE public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'personal',
  legal_name TEXT,
  icon TEXT DEFAULT '👤',
  color TEXT DEFAULT '#C4785A',
  avatar_url TEXT,
  country TEXT,
  jurisdiction TEXT,
  nationality TEXT,
  tax_residence TEXT,
  date_of_birth DATE,
  formation_date DATE,
  dissolution_date DATE,
  registration_number TEXT,
  legal_form TEXT,
  share_capital NUMERIC,
  share_capital_currency TEXT DEFAULT 'EUR',
  matrimonial_regime TEXT,
  marriage_date DATE,
  marriage_country TEXT,
  trust_type TEXT,
  trustee_name TEXT,
  beneficiaries JSONB,
  karta_name TEXT,
  coparceners JSONB,
  owned_by_entity_id UUID,
  ownership_percentage NUMERIC DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_entity_type CHECK (type = ANY (ARRAY['personal', 'spouse', 'partner', 'couple', 'company', 'holding', 'spv', 'trust', 'family', 'huf'])),
  CONSTRAINT valid_ownership_percentage CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100),
  CONSTRAINT entities_id_user_unique UNIQUE (id, user_id)
);

-- Add self-referencing FK for entity ownership (NO ACTION to prevent deletion errors)
ALTER TABLE public.entities
  ADD CONSTRAINT entities_owned_by_user_fk 
  FOREIGN KEY (owned_by_entity_id, user_id) 
  REFERENCES public.entities(id, user_id) 
  ON DELETE NO ACTION;

-- Assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  current_value NUMERIC NOT NULL,
  purchase_value NUMERIC,
  purchase_date DATE,
  institution TEXT,
  quantity NUMERIC,
  ticker TEXT,
  ownership_percentage NUMERIC DEFAULT 100,
  ownership_allocation JSONB,
  rental_income NUMERIC,
  notes TEXT,
  image_url TEXT,
  platform TEXT,
  reference_balance NUMERIC,
  reference_date DATE,
  entity_id UUID,
  acquisition_type TEXT DEFAULT 'purchase',
  acquisition_from TEXT,
  property_status TEXT DEFAULT 'owned',
  total_price NUMERIC,
  amount_paid NUMERIC,
  expected_delivery DATE,
  developer TEXT,
  unit_number TEXT,
  project_name TEXT,
  is_shariah_compliant BOOLEAN DEFAULT false,
  shariah_certification TEXT,
  tenure_type TEXT,
  lease_end_date DATE,
  liquidity_status TEXT DEFAULT 'liquid',
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  property_type TEXT,
  rooms INTEGER,
  size_sqm NUMERIC,
  certainty TEXT DEFAULT 'certain',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT assets_type_check CHECK (type = ANY (ARRAY['real-estate', 'bank', 'investment', 'crypto', 'business'])),
  CONSTRAINT assets_country_valid CHECK (country ~ '^[A-Z]{2}$'),
  CONSTRAINT assets_currency_valid CHECK (currency = ANY (ARRAY['EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB', 'JPY', 'CNY', 'INR', 'SGD', 'HKD', 'CAD', 'AUD', 'NZD', 'ZAR', 'BRL', 'MXN', 'KRW', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'PLN', 'CZK', 'HUF', 'SEK', 'NOK', 'DKK', 'ILS', 'TRY', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'EGP', 'MAD', 'NGN', 'KES', 'BWP'])),
  CONSTRAINT assets_ownership_percentage_range CHECK (ownership_percentage IS NULL OR (ownership_percentage >= 0 AND ownership_percentage <= 100)),
  CONSTRAINT assets_ownership_allocation_valid CHECK (validate_ownership_allocation(ownership_allocation)),
  CONSTRAINT valid_acquisition_type CHECK (acquisition_type = ANY (ARRAY['purchase', 'inheritance', 'donation', 'creation'])),
  CONSTRAINT assets_tenure_type_check CHECK (tenure_type = ANY (ARRAY['freehold', 'leasehold', 'share_of_freehold'])),
  CONSTRAINT assets_liquidity_status_check CHECK (liquidity_status = ANY (ARRAY['liquid', 'restricted', 'frozen', 'blocked'])),
  CONSTRAINT assets_id_user_unique UNIQUE (id, user_id)
);

-- Composite FK for assets -> entities
ALTER TABLE public.assets
  ADD CONSTRAINT assets_entity_user_fk 
  FOREIGN KEY (entity_id, user_id) 
  REFERENCES public.entities(id, user_id) 
  ON DELETE SET NULL;

-- Collections table
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  current_value NUMERIC NOT NULL,
  purchase_value NUMERIC,
  purchase_date DATE,
  description TEXT,
  model TEXT,
  brand TEXT,
  year INTEGER,
  image_url TEXT,
  notes TEXT,
  entity_id UUID,
  ownership_percentage NUMERIC DEFAULT 100,
  ownership_allocation JSONB,
  acquisition_type TEXT DEFAULT 'purchase',
  acquisition_from TEXT,
  certainty TEXT DEFAULT 'probable',
  fund_name TEXT,
  commitment_amount NUMERIC,
  called_amount NUMERIC,
  distribution_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT collections_type_check CHECK (type = ANY (ARRAY['watch', 'vehicle', 'art', 'jewelry', 'wine', 'vinyl', 'lp-position', 'other'])),
  CONSTRAINT collections_country_valid CHECK (country ~ '^[A-Z]{2}$'),
  CONSTRAINT collections_currency_valid CHECK (currency = ANY (ARRAY['EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB', 'JPY', 'CNY', 'INR', 'SGD', 'HKD', 'CAD', 'AUD', 'NZD', 'ZAR', 'BRL', 'MXN', 'KRW', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'PLN', 'CZK', 'HUF', 'SEK', 'NOK', 'DKK', 'ILS', 'TRY', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'EGP', 'MAD', 'NGN', 'KES', 'BWP'])),
  CONSTRAINT collections_ownership_percentage_range CHECK (ownership_percentage IS NULL OR (ownership_percentage >= 0 AND ownership_percentage <= 100)),
  CONSTRAINT collections_ownership_allocation_valid CHECK (validate_ownership_allocation(ownership_allocation)),
  CONSTRAINT valid_collection_acquisition_type CHECK (acquisition_type = ANY (ARRAY['purchase', 'inheritance', 'donation', 'creation'])),
  CONSTRAINT collections_id_user_unique UNIQUE (id, user_id)
);

-- Composite FK for collections -> entities
ALTER TABLE public.collections
  ADD CONSTRAINT collections_entity_user_fk 
  FOREIGN KEY (entity_id, user_id) 
  REFERENCES public.entities(id, user_id) 
  ON DELETE SET NULL;

-- Liabilities table
CREATE TABLE public.liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  current_balance NUMERIC NOT NULL,
  original_amount NUMERIC,
  interest_rate NUMERIC,
  monthly_payment NUMERIC,
  start_date DATE,
  end_date DATE,
  institution TEXT,
  linked_asset_id UUID,
  entity_id UUID,
  notes TEXT,
  certainty TEXT DEFAULT 'certain',
  financing_type TEXT DEFAULT 'conventional',
  is_shariah_compliant BOOLEAN DEFAULT false,
  shariah_advisor TEXT,
  cost_price NUMERIC,
  profit_margin NUMERIC,
  monthly_rental NUMERIC,
  residual_value NUMERIC,
  bank_ownership_percentage NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT liabilities_type_check CHECK (type = ANY (ARRAY['mortgage', 'car_loan', 'personal_loan', 'student_loan', 'business_loan', 'credit_card', 'line_of_credit', 'margin_loan', 'tax_debt', 'family_loan', 'other', 'loan'])),
  CONSTRAINT liabilities_country_valid CHECK (country ~ '^[A-Z]{2}$'),
  CONSTRAINT liabilities_currency_valid CHECK (currency = ANY (ARRAY['EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB', 'JPY', 'CNY', 'INR', 'SGD', 'HKD', 'CAD', 'AUD', 'NZD', 'ZAR', 'BRL', 'MXN', 'KRW', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'PLN', 'CZK', 'HUF', 'SEK', 'NOK', 'DKK', 'ILS', 'TRY', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'EGP', 'MAD', 'NGN', 'KES', 'BWP'])),
  CONSTRAINT liabilities_balance_non_negative CHECK (current_balance >= 0),
  CONSTRAINT liabilities_interest_rate_range CHECK (interest_rate IS NULL OR (interest_rate >= 0 AND interest_rate <= 100)),
  CONSTRAINT liabilities_id_user_unique UNIQUE (id, user_id)
);

-- Composite FKs for liabilities
ALTER TABLE public.liabilities
  ADD CONSTRAINT liabilities_entity_user_fk 
  FOREIGN KEY (entity_id, user_id) 
  REFERENCES public.entities(id, user_id) 
  ON DELETE SET NULL;

ALTER TABLE public.liabilities
  ADD CONSTRAINT liabilities_asset_user_fk 
  FOREIGN KEY (linked_asset_id, user_id) 
  REFERENCES public.assets(id, user_id) 
  ON DELETE SET NULL;

-- Receivables table
CREATE TABLE public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  currency TEXT NOT NULL,
  original_amount NUMERIC NOT NULL,
  current_balance NUMERIC NOT NULL,
  debtor_name TEXT NOT NULL,
  debtor_type TEXT,
  debtor_contact TEXT,
  issue_date DATE,
  due_date DATE,
  interest_rate NUMERIC,
  repayment_schedule TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  recovery_probability TEXT,
  certainty TEXT DEFAULT 'contractual',
  linked_asset_id UUID,
  deposit_type TEXT,
  refund_conditions TEXT,
  entity_id UUID,
  last_payment_date DATE,
  last_payment_amount NUMERIC,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT receivables_type_check CHECK (type = ANY (ARRAY['personal_loan', 'business_loan', 'expense_reimbursement', 'deposit', 'advance', 'other'])),
  CONSTRAINT receivables_currency_valid CHECK (currency = ANY (ARRAY['EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB', 'JPY', 'CNY', 'INR', 'SGD', 'HKD', 'CAD', 'AUD', 'NZD', 'ZAR', 'BRL', 'MXN', 'KRW', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'PLN', 'CZK', 'HUF', 'SEK', 'NOK', 'DKK', 'ILS', 'TRY', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'EGP', 'MAD', 'NGN', 'KES', 'BWP'])),
  CONSTRAINT receivables_status_check CHECK (status = ANY (ARRAY['pending', 'partial', 'paid', 'written_off', 'disputed'])),
  CONSTRAINT receivables_debtor_type_check CHECK (debtor_type = ANY (ARRAY['individual', 'company', 'employer', 'landlord', 'service_provider'])),
  CONSTRAINT receivables_deposit_type_check CHECK (deposit_type = ANY (ARRAY['rental', 'utility', 'service', 'security'])),
  CONSTRAINT receivables_recovery_probability_check CHECK (recovery_probability = ANY (ARRAY['certain', 'likely', 'uncertain', 'doubtful'])),
  CONSTRAINT receivables_repayment_schedule_check CHECK (repayment_schedule = ANY (ARRAY['one_time', 'monthly', 'quarterly', 'flexible'])),
  CONSTRAINT receivables_id_user_unique UNIQUE (id, user_id)
);

-- Composite FKs for receivables
ALTER TABLE public.receivables
  ADD CONSTRAINT receivables_entity_user_fk 
  FOREIGN KEY (entity_id, user_id) 
  REFERENCES public.entities(id, user_id) 
  ON DELETE SET NULL;

ALTER TABLE public.receivables
  ADD CONSTRAINT receivables_linked_asset_user_fk 
  FOREIGN KEY (linked_asset_id, user_id) 
  REFERENCES public.assets(id, user_id) 
  ON DELETE SET NULL;

-- Receivable payments table
CREATE TABLE public.receivable_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receivable_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT receivable_payments_payment_method_check CHECK (payment_method = ANY (ARRAY['bank_transfer', 'cash', 'check', 'crypto', 'other']))
);

-- Composite FK for receivable_payments
ALTER TABLE public.receivable_payments
  ADD CONSTRAINT payments_receivable_user_fk 
  FOREIGN KEY (receivable_id, user_id) 
  REFERENCES public.receivables(id, user_id) 
  ON DELETE CASCADE;

-- Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  document_date DATE,
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT false,
  verification_date DATE,
  tags TEXT[],
  notes TEXT,
  asset_id UUID,
  collection_id UUID,
  liability_id UUID,
  entity_id UUID,
  receivable_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT documents_type_check CHECK (type = ANY (ARRAY['title_deed', 'contract', 'invoice', 'passport', 'tax_return', 'statement', 'insurance', 'valuation', 'certificate', 'other'])),
  CONSTRAINT documents_file_size_check CHECK (file_size <= 10485760),
  CONSTRAINT at_least_one_link CHECK (asset_id IS NOT NULL OR collection_id IS NOT NULL OR liability_id IS NOT NULL OR entity_id IS NOT NULL OR receivable_id IS NOT NULL)
);

-- Composite FKs for documents (tenant-safe)
ALTER TABLE public.documents
  ADD CONSTRAINT documents_asset_user_fk 
  FOREIGN KEY (asset_id, user_id) 
  REFERENCES public.assets(id, user_id) 
  ON DELETE SET NULL;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_collection_user_fk 
  FOREIGN KEY (collection_id, user_id) 
  REFERENCES public.collections(id, user_id) 
  ON DELETE SET NULL;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_liability_user_fk 
  FOREIGN KEY (liability_id, user_id) 
  REFERENCES public.liabilities(id, user_id) 
  ON DELETE SET NULL;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_entity_user_fk 
  FOREIGN KEY (entity_id, user_id) 
  REFERENCES public.entities(id, user_id) 
  ON DELETE SET NULL;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_receivable_user_fk 
  FOREIGN KEY (receivable_id, user_id) 
  REFERENCES public.receivables(id, user_id) 
  ON DELETE SET NULL;

-- Loan schedules table
CREATE TABLE public.loan_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  liability_id UUID NOT NULL,
  principal_amount NUMERIC NOT NULL,
  interest_rate NUMERIC,
  start_date DATE NOT NULL,
  end_date DATE,
  term_months INTEGER,
  monthly_payment NUMERIC,
  total_interest NUMERIC,
  total_cost NUMERIC,
  payments_made INTEGER DEFAULT 0,
  next_payment_date DATE,
  remaining_principal NUMERIC,
  loan_type TEXT DEFAULT 'amortizing',
  rate_type TEXT DEFAULT 'fixed',
  payment_frequency TEXT DEFAULT 'monthly',
  imported_schedule JSONB,
  is_imported BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT loan_schedules_loan_type_check CHECK (loan_type = ANY (ARRAY['amortizing', 'bullet', 'balloon', 'interest_only'])),
  CONSTRAINT loan_schedules_rate_type_check CHECK (rate_type = ANY (ARRAY['fixed', 'variable', 'capped'])),
  CONSTRAINT loan_schedules_payment_frequency_check CHECK (payment_frequency = ANY (ARRAY['monthly', 'quarterly', 'semi_annual', 'annual'])),
  CONSTRAINT loan_schedules_interest_rate_range CHECK (interest_rate IS NULL OR (interest_rate >= 0 AND interest_rate <= 100)),
  CONSTRAINT loan_schedules_id_user_unique UNIQUE (id, user_id)
);

-- Composite FK for loan_schedules
ALTER TABLE public.loan_schedules
  ADD CONSTRAINT loan_schedules_liability_user_fk 
  FOREIGN KEY (liability_id, user_id) 
  REFERENCES public.liabilities(id, user_id) 
  ON DELETE CASCADE;

-- Loan payments table
CREATE TABLE public.loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  loan_schedule_id UUID NOT NULL,
  payment_number INTEGER NOT NULL,
  payment_date DATE NOT NULL,
  principal_amount NUMERIC,
  interest_amount NUMERIC,
  total_amount NUMERIC,
  remaining_principal NUMERIC,
  status TEXT DEFAULT 'scheduled',
  actual_payment_date DATE,
  actual_amount NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT loan_payments_status_check CHECK (status = ANY (ARRAY['scheduled', 'paid', 'late', 'missed'])),
  CONSTRAINT loan_payments_unique_per_schedule UNIQUE (loan_schedule_id, payment_number)
);

-- Composite FK for loan_payments
ALTER TABLE public.loan_payments
  ADD CONSTRAINT loan_payments_schedule_user_fk 
  FOREIGN KEY (loan_schedule_id, user_id) 
  REFERENCES public.loan_schedules(id, user_id) 
  ON DELETE CASCADE;

-- Payment schedules table (for off-plan properties)
CREATE TABLE public.payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  asset_id UUID NOT NULL,
  payment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  percentage NUMERIC,
  currency TEXT NOT NULL DEFAULT 'AED',
  description TEXT,
  status TEXT DEFAULT 'pending',
  paid_date DATE,
  paid_amount NUMERIC,
  payment_reference TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT payment_schedules_status_check CHECK (status = ANY (ARRAY['pending', 'paid', 'overdue', 'scheduled']))
);

-- Composite FK for payment_schedules
ALTER TABLE public.payment_schedules
  ADD CONSTRAINT schedules_asset_user_fk 
  FOREIGN KEY (asset_id, user_id) 
  REFERENCES public.assets(id, user_id) 
  ON DELETE CASCADE;

-- Net worth history table
CREATE TABLE public.net_worth_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_assets_eur NUMERIC NOT NULL,
  total_collections_eur NUMERIC NOT NULL,
  total_liabilities_eur NUMERIC NOT NULL,
  net_worth_eur NUMERIC NOT NULL,
  breakdown_by_type JSONB,
  breakdown_by_country JSONB,
  breakdown_by_currency JSONB,
  exchange_rates_snapshot JSONB,
  crypto_prices_snapshot JSONB,
  certainty_breakdown_assets JSONB,
  certainty_breakdown_liabilities JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit events table (insert-only)
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shared access table
CREATE TABLE public.shared_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  shared_with_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT shared_access_status_check CHECK (status = ANY (ARRAY['pending', 'accepted', 'revoked', 'declined']))
);

-- =====================================================
-- SECTION 3: INDEXES
-- =====================================================

-- Assets indexes
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_entity ON public.assets(user_id, entity_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON public.assets(type);

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_entity ON public.collections(user_id, entity_id);
CREATE INDEX IF NOT EXISTS idx_collections_type ON public.collections(type);

-- Liabilities indexes
CREATE INDEX IF NOT EXISTS idx_liabilities_user_id ON public.liabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_user_entity ON public.liabilities(user_id, entity_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_linked_asset ON public.liabilities(linked_asset_id);

-- Entities indexes
CREATE INDEX IF NOT EXISTS idx_entities_user_id ON public.entities(user_id);
CREATE INDEX IF NOT EXISTS idx_entities_owned_by ON public.entities(owned_by_entity_id);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_asset_id ON public.documents(asset_id);
CREATE INDEX IF NOT EXISTS idx_documents_collection_id ON public.documents(collection_id);
CREATE INDEX IF NOT EXISTS idx_documents_liability_id ON public.documents(liability_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity_id ON public.documents(entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_receivable_id ON public.documents(receivable_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_expiry_date ON public.documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON public.documents(user_id, expiry_date);

-- Receivables indexes
CREATE INDEX IF NOT EXISTS idx_receivables_user_id ON public.receivables(user_id);
CREATE INDEX IF NOT EXISTS idx_receivables_status ON public.receivables(status);
CREATE INDEX IF NOT EXISTS idx_receivables_due_date ON public.receivables(due_date);
CREATE INDEX IF NOT EXISTS idx_receivables_user_entity ON public.receivables(user_id, entity_id);
CREATE INDEX IF NOT EXISTS idx_receivables_linked_asset ON public.receivables(linked_asset_id);

-- Receivable payments indexes
CREATE INDEX IF NOT EXISTS idx_receivable_payments_user_id ON public.receivable_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_receivable ON public.receivable_payments(receivable_id);

-- Loan schedules indexes
CREATE INDEX IF NOT EXISTS idx_loan_schedules_user_id ON public.loan_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_schedules_liability ON public.loan_schedules(liability_id);

-- Loan payments indexes
CREATE INDEX IF NOT EXISTS idx_loan_payments_user_id ON public.loan_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_schedule ON public.loan_payments(loan_schedule_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_date ON public.loan_payments(payment_date);

-- Payment schedules indexes
CREATE INDEX IF NOT EXISTS idx_payment_schedules_user_id ON public.payment_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_asset ON public.payment_schedules(asset_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due ON public.payment_schedules(due_date);

-- Net worth history indexes
CREATE INDEX IF NOT EXISTS idx_net_worth_history_user_id ON public.net_worth_history(user_id);
CREATE INDEX IF NOT EXISTS idx_net_worth_history_date ON public.net_worth_history(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_net_worth_history_user_date ON public.net_worth_history(user_id, snapshot_date DESC);

-- Audit events indexes
CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON public.audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON public.audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity_type ON public.audit_events(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON public.audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_user_time ON public.audit_events(user_id, created_at DESC);

-- Shared access indexes
CREATE INDEX IF NOT EXISTS idx_shared_access_owner ON public.shared_access(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_access_shared_with ON public.shared_access(shared_with_id);
CREATE INDEX IF NOT EXISTS idx_shared_access_status ON public.shared_access(status);

-- =====================================================
-- SECTION 4: ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivable_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_worth_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_access ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Helper subquery for shared access
-- Used in SELECT policies to allow read-only access for shared users

-- Assets policies
CREATE POLICY "Users can view own assets" ON public.assets
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT owner_id FROM shared_access WHERE shared_with_id = auth.uid() AND status = 'accepted')
  );

CREATE POLICY "Users can insert own assets" ON public.assets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own assets" ON public.assets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own assets" ON public.assets
  FOR DELETE USING (user_id = auth.uid());

-- Collections policies
CREATE POLICY "Users can view own collections" ON public.collections
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT owner_id FROM shared_access WHERE shared_with_id = auth.uid() AND status = 'accepted')
  );

CREATE POLICY "Users can insert own collections" ON public.collections
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own collections" ON public.collections
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own collections" ON public.collections
  FOR DELETE USING (user_id = auth.uid());

-- Liabilities policies
CREATE POLICY "Users can view own liabilities" ON public.liabilities
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT owner_id FROM shared_access WHERE shared_with_id = auth.uid() AND status = 'accepted')
  );

CREATE POLICY "Users can insert own liabilities" ON public.liabilities
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own liabilities" ON public.liabilities
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own liabilities" ON public.liabilities
  FOR DELETE USING (user_id = auth.uid());

-- Entities policies
CREATE POLICY "Users can view own entities" ON public.entities
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT owner_id FROM shared_access WHERE shared_with_id = auth.uid() AND status = 'accepted')
  );

CREATE POLICY "Users can insert own entities" ON public.entities
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own entities" ON public.entities
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own entities" ON public.entities
  FOR DELETE USING (user_id = auth.uid());

-- Documents policies
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT owner_id FROM shared_access WHERE shared_with_id = auth.uid() AND status = 'accepted')
  );

CREATE POLICY "Users can insert own documents" ON public.documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (user_id = auth.uid());

-- Receivables policies
CREATE POLICY "Users can view own receivables" ON public.receivables
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT owner_id FROM shared_access WHERE shared_with_id = auth.uid() AND status = 'accepted')
  );

CREATE POLICY "Users can insert own receivables" ON public.receivables
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own receivables" ON public.receivables
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own receivables" ON public.receivables
  FOR DELETE USING (user_id = auth.uid());

-- Receivable payments policies
CREATE POLICY "Users can view own payments" ON public.receivable_payments
  FOR SELECT USING (
    (user_id = auth.uid() AND EXISTS (SELECT 1 FROM receivables r WHERE r.id = receivable_id AND r.user_id = auth.uid()))
    OR user_id IN (SELECT owner_id FROM shared_access WHERE shared_with_id = auth.uid() AND status = 'accepted')
  );

CREATE POLICY "Users can insert own payments" ON public.receivable_payments
  FOR INSERT WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM receivables r WHERE r.id = receivable_id AND r.user_id = auth.uid()));

CREATE POLICY "Users can update own payments" ON public.receivable_payments
  FOR UPDATE USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM receivables r WHERE r.id = receivable_id AND r.user_id = auth.uid()));

CREATE POLICY "Users can delete own payments" ON public.receivable_payments
  FOR DELETE USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM receivables r WHERE r.id = receivable_id AND r.user_id = auth.uid()));

-- Loan schedules policies
CREATE POLICY "Users can view own loan_schedules" ON public.loan_schedules
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT owner_id FROM shared_access WHERE shared_with_id = auth.uid() AND status = 'accepted')
  );

CREATE POLICY "Users can insert own loan_schedules" ON public.loan_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loan_schedules" ON public.loan_schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loan_schedules" ON public.loan_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Loan payments policies
CREATE POLICY "Users can view own loan_payments" ON public.loan_payments
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT owner_id FROM shared_access WHERE shared_with_id = auth.uid() AND status = 'accepted')
  );

CREATE POLICY "Users can insert own loan_payments" ON public.loan_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loan_payments" ON public.loan_payments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loan_payments" ON public.loan_payments
  FOR DELETE USING (auth.uid() = user_id);

-- Payment schedules policies
CREATE POLICY "Users can view own payment schedules" ON public.payment_schedules
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT owner_id FROM shared_access WHERE shared_with_id = auth.uid() AND status = 'accepted')
  );

CREATE POLICY "Users can insert own payment schedules" ON public.payment_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment schedules" ON public.payment_schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment schedules" ON public.payment_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Net worth history policies
CREATE POLICY "Users can view own history" ON public.net_worth_history
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT owner_id FROM shared_access WHERE shared_with_id = auth.uid() AND status = 'accepted')
  );

CREATE POLICY "Users can insert own history" ON public.net_worth_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own history" ON public.net_worth_history
  FOR DELETE USING (user_id = auth.uid());

-- Audit events policies (read-only for users, insert via trigger only)
CREATE POLICY "Users can view own audit events" ON public.audit_events
  FOR SELECT USING (user_id = auth.uid());

-- Shared access policies
CREATE POLICY "Users can view shares they own or received" ON public.shared_access
  FOR SELECT USING (owner_id = auth.uid() OR shared_with_id = auth.uid());

CREATE POLICY "Users can create shares" ON public.shared_access
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their shares" ON public.shared_access
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Receivers can accept shares" ON public.shared_access
  FOR UPDATE USING (shared_with_id = auth.uid())
  WITH CHECK (shared_with_id = auth.uid() AND status IN ('accepted', 'declined'));

CREATE POLICY "Users can delete shares they own" ON public.shared_access
  FOR DELETE USING (owner_id = auth.uid());

-- =====================================================
-- SECTION 5: TRIGGERS
-- =====================================================

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_liabilities_updated_at BEFORE UPDATE ON public.liabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_receivables_updated_at BEFORE UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_loan_schedules_updated_at BEFORE UPDATE ON public.loan_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payment_schedules_updated_at BEFORE UPDATE ON public.payment_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Audit logging triggers (minimal logging)
CREATE TRIGGER audit_assets AFTER INSERT OR UPDATE OR DELETE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_collections AFTER INSERT OR UPDATE OR DELETE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_liabilities AFTER INSERT OR UPDATE OR DELETE ON public.liabilities
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_entities AFTER INSERT OR UPDATE OR DELETE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_receivables AFTER INSERT OR UPDATE OR DELETE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Circular ownership prevention trigger
CREATE TRIGGER prevent_circular_ownership BEFORE INSERT OR UPDATE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION check_circular_ownership();

-- Default entity creation trigger
CREATE TRIGGER create_default_entity_on_profile AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION ensure_default_entity();

-- Receivable payment auto-update trigger
CREATE TRIGGER after_receivable_payment_insert AFTER INSERT ON public.receivable_payments
  FOR EACH ROW EXECUTE FUNCTION update_receivable_on_payment();

-- Shared access receiver restriction trigger
CREATE TRIGGER enforce_receiver_update_restrictions_trigger BEFORE UPDATE ON public.shared_access
  FOR EACH ROW EXECUTE FUNCTION enforce_receiver_update_restrictions();

-- =====================================================
-- SECTION 6: AUTH TRIGGER (for new user registration)
-- Must be created in auth schema
-- =====================================================

-- NOTE: Run this in Supabase dashboard SQL editor:
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SECTION 7: STORAGE BUCKETS
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documents', 'documents', false, NULL, NULL),
  ('asset-images', 'asset-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SECTION 8: STORAGE POLICIES
-- =====================================================

-- Documents bucket policies (TO authenticated restricts to logged-in users only)
CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Asset images bucket policies (TO authenticated restricts to logged-in users only)
CREATE POLICY "Users can view own images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- END OF SCHEMA
-- =====================================================
