-- ============================================================
-- VERSO DATABASE SCHEMA EXPORT
-- Generated: 2025-12-16
-- Database: PostgreSQL (Supabase)
-- ============================================================

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to check circular ownership in entities
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
    SELECT owned_by_entity_id INTO current_id FROM public.entities WHERE id = current_id;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Function to ensure default entity is created for new users
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

-- Function to update receivable on payment
CREATE OR REPLACE FUNCTION public.update_receivable_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.receivables
  SET 
    current_balance = current_balance - NEW.amount,
    last_payment_date = NEW.payment_date,
    last_payment_amount = NEW.amount,
    status = CASE 
      WHEN current_balance - NEW.amount <= 0 THEN 'paid'
      WHEN current_balance - NEW.amount < original_amount THEN 'partial'
      ELSE status
    END,
    updated_at = now()
  WHERE id = NEW.receivable_id;
  
  RETURN NEW;
END;
$function$;

-- Function to enforce receiver update restrictions on shared_access
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

-- Function to validate ownership allocation percentages
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

-- Function to handle new user registration
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

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles table (user settings and preferences)
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  base_currency text DEFAULT 'EUR'::text,
  secondary_currency_1 text DEFAULT 'USD'::text,
  secondary_currency_2 text DEFAULT 'AED'::text,
  dark_mode boolean DEFAULT true,
  blur_amounts boolean DEFAULT false,
  area_unit text DEFAULT 'sqm'::text,
  monthly_income numeric,
  monthly_income_currency text DEFAULT 'EUR'::text,
  fiscal_year_start text DEFAULT '01-01'::text,
  compliance_mode text DEFAULT 'none'::text,
  news_sources jsonb DEFAULT '["bloomberg", "reuters"]'::jsonb,
  dashboard_widgets jsonb DEFAULT '["net_worth", "chart", "breakdown_type", "breakdown_country", "breakdown_currency", "leasehold_reminders", "expiring_documents"]'::jsonb,
  favorite_cities jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Entities table (ownership structures: personal, company, trust, etc.)
CREATE TABLE public.entities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'personal'::text,
  icon text DEFAULT '👤'::text,
  color text DEFAULT '#C4785A'::text,
  country text,
  jurisdiction text,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  avatar_url text,
  -- Individual fields
  date_of_birth date,
  nationality text,
  tax_residence text,
  -- Couple fields
  matrimonial_regime text,
  marriage_date date,
  marriage_country text,
  -- Company/Holding/SPV fields
  legal_name text,
  legal_form text,
  registration_number text,
  share_capital numeric,
  share_capital_currency text DEFAULT 'EUR'::text,
  formation_date date,
  dissolution_date date,
  -- Trust fields
  trust_type text,
  trustee_name text,
  beneficiaries jsonb,
  -- HUF fields
  karta_name text,
  coparceners jsonb,
  -- Ownership hierarchy
  owned_by_entity_id uuid,
  ownership_percentage numeric DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Assets table (real estate, investments, bank accounts, crypto, business)
CREATE TABLE public.assets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  entity_id uuid,
  name text NOT NULL,
  type text NOT NULL,
  country text NOT NULL,
  currency text NOT NULL,
  current_value numeric NOT NULL,
  purchase_value numeric,
  purchase_date date,
  certainty text DEFAULT 'certain'::text,
  notes text,
  image_url text,
  -- Ownership
  ownership_percentage numeric DEFAULT 100,
  ownership_allocation jsonb,
  acquisition_type text DEFAULT 'purchase'::text,
  acquisition_from text,
  -- Real estate specific
  address text,
  latitude numeric,
  longitude numeric,
  property_type text,
  property_status text DEFAULT 'owned'::text,
  tenure_type text,
  lease_end_date date,
  size_sqm numeric,
  rooms integer,
  rental_income numeric,
  -- Off-plan real estate
  developer text,
  project_name text,
  unit_number text,
  expected_delivery date,
  total_price numeric,
  amount_paid numeric,
  -- Bank account specific
  institution text,
  reference_balance numeric,
  reference_date date,
  -- Investment/Crypto specific
  ticker text,
  quantity numeric,
  platform text,
  -- Shariah compliance
  is_shariah_compliant boolean DEFAULT false,
  shariah_certification text,
  -- Status
  liquidity_status text DEFAULT 'liquid'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Collections table (watches, vehicles, art, jewelry, wine, vinyl, etc.)
CREATE TABLE public.collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  entity_id uuid,
  name text NOT NULL,
  type text NOT NULL,
  country text NOT NULL,
  currency text NOT NULL,
  current_value numeric NOT NULL,
  purchase_value numeric,
  purchase_date date,
  certainty text DEFAULT 'probable'::text,
  notes text,
  image_url text,
  description text,
  -- Ownership
  ownership_percentage numeric DEFAULT 100,
  ownership_allocation jsonb,
  acquisition_type text DEFAULT 'purchase'::text,
  acquisition_from text,
  -- Collection specific
  brand text,
  model text,
  year integer,
  -- LP/Fund specific
  fund_name text,
  commitment_amount numeric,
  called_amount numeric,
  distribution_status text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Liabilities table (mortgages, loans, credit cards, etc.)
CREATE TABLE public.liabilities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  entity_id uuid,
  linked_asset_id uuid,
  name text NOT NULL,
  type text NOT NULL,
  country text NOT NULL,
  currency text NOT NULL,
  current_balance numeric NOT NULL,
  original_amount numeric,
  interest_rate numeric,
  monthly_payment numeric,
  start_date date,
  end_date date,
  institution text,
  certainty text DEFAULT 'certain'::text,
  notes text,
  -- Islamic finance fields
  financing_type text DEFAULT 'conventional'::text,
  is_shariah_compliant boolean DEFAULT false,
  shariah_advisor text,
  cost_price numeric,
  profit_margin numeric,
  monthly_rental numeric,
  residual_value numeric,
  bank_ownership_percentage numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Receivables table (money owed TO the user)
CREATE TABLE public.receivables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  entity_id uuid,
  linked_asset_id uuid,
  name text NOT NULL,
  type text NOT NULL,
  debtor_name text NOT NULL,
  debtor_type text,
  debtor_contact text,
  currency text NOT NULL,
  original_amount numeric NOT NULL,
  current_balance numeric NOT NULL,
  interest_rate numeric,
  issue_date date,
  due_date date,
  repayment_schedule text,
  status text NOT NULL DEFAULT 'pending'::text,
  certainty text DEFAULT 'contractual'::text,
  recovery_probability text,
  notes text,
  description text,
  -- Deposit specific
  deposit_type text,
  refund_conditions text,
  -- Payment tracking
  last_payment_date date,
  last_payment_amount numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Receivable payments table
CREATE TABLE public.receivable_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  receivable_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL,
  payment_date date NOT NULL,
  payment_method text,
  reference text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Documents table (proofs and certificates)
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  asset_id uuid,
  collection_id uuid,
  liability_id uuid,
  entity_id uuid,
  receivable_id uuid,
  name text NOT NULL,
  type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  document_date date,
  expiry_date date,
  is_verified boolean DEFAULT false,
  verification_date date,
  tags text[],
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Payment schedules table (off-plan property installments)
CREATE TABLE public.payment_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  payment_number integer NOT NULL,
  amount numeric NOT NULL,
  percentage numeric,
  currency text NOT NULL DEFAULT 'AED'::text,
  due_date date NOT NULL,
  status text DEFAULT 'pending'::text,
  description text,
  paid_date date,
  paid_amount numeric,
  payment_reference text,
  receipt_url text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Loan schedules table (amortization tracking)
CREATE TABLE public.loan_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  liability_id uuid NOT NULL,
  principal_amount numeric NOT NULL,
  interest_rate numeric,
  start_date date NOT NULL,
  end_date date,
  term_months integer,
  loan_type text DEFAULT 'amortizing'::text,
  rate_type text DEFAULT 'fixed'::text,
  payment_frequency text DEFAULT 'monthly'::text,
  monthly_payment numeric,
  total_interest numeric,
  total_cost numeric,
  payments_made integer DEFAULT 0,
  next_payment_date date,
  remaining_principal numeric,
  is_imported boolean DEFAULT false,
  imported_schedule jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Loan payments table (individual payment records)
CREATE TABLE public.loan_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  loan_schedule_id uuid NOT NULL,
  payment_number integer NOT NULL,
  payment_date date NOT NULL,
  principal_amount numeric,
  interest_amount numeric,
  total_amount numeric,
  remaining_principal numeric,
  status text DEFAULT 'scheduled'::text,
  actual_payment_date date,
  actual_amount numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Net worth history table (snapshots)
CREATE TABLE public.net_worth_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  snapshot_date date NOT NULL,
  total_assets_eur numeric NOT NULL,
  total_collections_eur numeric NOT NULL,
  total_liabilities_eur numeric NOT NULL,
  net_worth_eur numeric NOT NULL,
  breakdown_by_type jsonb,
  breakdown_by_country jsonb,
  breakdown_by_currency jsonb,
  certainty_breakdown_assets jsonb,
  certainty_breakdown_liabilities jsonb,
  exchange_rates_snapshot jsonb,
  crypto_prices_snapshot jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Shared access table (partner/advisor sharing)
CREATE TABLE public.shared_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  shared_with_email text NOT NULL,
  shared_with_id uuid,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now()
);

-- Audit events table (activity logging)
CREATE TABLE public.audit_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivable_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_worth_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: profiles
-- ============================================================

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- RLS POLICIES: entities
-- ============================================================

CREATE POLICY "Users can view own entities" ON public.entities
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own entities" ON public.entities
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own entities" ON public.entities
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own entities" ON public.entities
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES: assets (with shared access)
-- ============================================================

CREATE POLICY "Users can view own assets" ON public.assets
  FOR SELECT USING (
    (user_id = auth.uid()) OR 
    (user_id IN (
      SELECT shared_access.owner_id FROM shared_access
      WHERE shared_access.shared_with_id = auth.uid() 
        AND shared_access.status = 'accepted'::text
    ))
  );

CREATE POLICY "Users can insert own assets" ON public.assets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own assets" ON public.assets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own assets" ON public.assets
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES: collections (with shared access)
-- ============================================================

CREATE POLICY "Users can view own collections" ON public.collections
  FOR SELECT USING (
    (user_id = auth.uid()) OR 
    (user_id IN (
      SELECT shared_access.owner_id FROM shared_access
      WHERE shared_access.shared_with_id = auth.uid() 
        AND shared_access.status = 'accepted'::text
    ))
  );

CREATE POLICY "Users can insert own collections" ON public.collections
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own collections" ON public.collections
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own collections" ON public.collections
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES: liabilities (with shared access)
-- ============================================================

CREATE POLICY "Users can view own liabilities" ON public.liabilities
  FOR SELECT USING (
    (user_id = auth.uid()) OR 
    (user_id IN (
      SELECT shared_access.owner_id FROM shared_access
      WHERE shared_access.shared_with_id = auth.uid() 
        AND shared_access.status = 'accepted'::text
    ))
  );

CREATE POLICY "Users can insert own liabilities" ON public.liabilities
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own liabilities" ON public.liabilities
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own liabilities" ON public.liabilities
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES: receivables (with shared access)
-- ============================================================

CREATE POLICY "Users can view own receivables" ON public.receivables
  FOR SELECT USING (
    (user_id = auth.uid()) OR 
    (user_id IN (
      SELECT shared_access.owner_id FROM shared_access
      WHERE shared_access.shared_with_id = auth.uid() 
        AND shared_access.status = 'accepted'::text
    ))
  );

CREATE POLICY "Users can insert own receivables" ON public.receivables
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own receivables" ON public.receivables
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own receivables" ON public.receivables
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES: receivable_payments
-- ============================================================

CREATE POLICY "Users can view own payments" ON public.receivable_payments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments" ON public.receivable_payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payments" ON public.receivable_payments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own payments" ON public.receivable_payments
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES: documents
-- ============================================================

CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents" ON public.documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES: payment_schedules
-- ============================================================

CREATE POLICY "Users can view own payment schedules" ON public.payment_schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment schedules" ON public.payment_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment schedules" ON public.payment_schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment schedules" ON public.payment_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: loan_schedules
-- ============================================================

CREATE POLICY "Users can view own loan_schedules" ON public.loan_schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loan_schedules" ON public.loan_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loan_schedules" ON public.loan_schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loan_schedules" ON public.loan_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: loan_payments
-- ============================================================

CREATE POLICY "Users can view own loan_payments" ON public.loan_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loan_payments" ON public.loan_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loan_payments" ON public.loan_payments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loan_payments" ON public.loan_payments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: net_worth_history (with shared access)
-- ============================================================

CREATE POLICY "Users can view own history" ON public.net_worth_history
  FOR SELECT USING (
    (user_id = auth.uid()) OR 
    (user_id IN (
      SELECT shared_access.owner_id FROM shared_access
      WHERE shared_access.shared_with_id = auth.uid() 
        AND shared_access.status = 'accepted'::text
    ))
  );

CREATE POLICY "Users can insert own history" ON public.net_worth_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own history" ON public.net_worth_history
  FOR DELETE USING (user_id = auth.uid());

-- Note: No UPDATE policy - snapshots are immutable

-- ============================================================
-- RLS POLICIES: shared_access
-- ============================================================

CREATE POLICY "Users can view shares they own or received" ON public.shared_access
  FOR SELECT USING ((owner_id = auth.uid()) OR (shared_with_id = auth.uid()));

CREATE POLICY "Users can create shares" ON public.shared_access
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their shares" ON public.shared_access
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Receivers can accept shares" ON public.shared_access
  FOR UPDATE USING (shared_with_id = auth.uid())
  WITH CHECK (
    (shared_with_id = auth.uid()) AND 
    (owner_id = (SELECT owner_id FROM shared_access WHERE id = shared_access.id))
  );

CREATE POLICY "Users can delete shares they own" ON public.shared_access
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================================
-- RLS POLICIES: audit_events
-- ============================================================

CREATE POLICY "Users can view own audit events" ON public.audit_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own audit events" ON public.audit_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Note: No UPDATE or DELETE policies - audit log is append-only

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: Create profile on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Create default entity on new profile
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_default_entity();

-- Trigger: Check circular ownership in entities
CREATE TRIGGER check_entity_circular_ownership
  BEFORE INSERT OR UPDATE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.check_circular_ownership();

-- Trigger: Update receivable on payment
CREATE TRIGGER on_receivable_payment_created
  AFTER INSERT ON public.receivable_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_receivable_on_payment();

-- Trigger: Enforce receiver update restrictions on shared_access
CREATE TRIGGER enforce_shared_access_receiver_restrictions
  BEFORE UPDATE ON public.shared_access
  FOR EACH ROW EXECUTE FUNCTION public.enforce_receiver_update_restrictions();

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Asset images bucket (public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('asset-images', 'asset-images', true)
ON CONFLICT (id) DO NOTHING;

-- Documents bucket (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
