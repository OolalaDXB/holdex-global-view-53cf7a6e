-- ============================================================================
-- VERSO COMPLETE DATABASE SCHEMA EXPORT
-- For migration to fresh Supabase project (Zurich)
-- Generated: 2024-12-16
-- Schema-only, no data
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- FUNCTIONS (in dependency order)
-- ============================================================================

-- Function: update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Function: validate_ownership_allocation
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

-- Function: check_circular_ownership
CREATE OR REPLACE FUNCTION public.check_circular_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
      AND user_id = NEW.user_id;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Function: enforce_receiver_update_restrictions
CREATE OR REPLACE FUNCTION public.enforce_receiver_update_restrictions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Function: ensure_default_entity
CREATE OR REPLACE FUNCTION public.ensure_default_entity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.entities (user_id, name, type, icon, color)
  VALUES (NEW.id, 'Personal', 'personal', '👤', '#C4785A')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Function: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$function$;

-- Function: log_audit_event
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Function: update_receivable_on_payment
CREATE OR REPLACE FUNCTION public.update_receivable_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- ============================================================================
-- TABLES
-- ============================================================================

-- Table: profiles
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
  dashboard_widgets jsonb DEFAULT '["net_worth", "chart", "breakdown_type", "breakdown_country", "breakdown_currency", "leasehold_reminders", "expiring_documents"]'::jsonb,
  favorite_cities jsonb DEFAULT '[]'::jsonb,
  news_sources jsonb DEFAULT '["bloomberg", "reuters"]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Link profiles to auth.users
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_auth_users_fk
  FOREIGN KEY (id) REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Table: entities
CREATE TABLE public.entities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'personal'::text,
  legal_name text,
  registration_number text,
  country text,
  jurisdiction text,
  formation_date date,
  dissolution_date date,
  is_active boolean NOT NULL DEFAULT true,
  icon text DEFAULT '👤'::text,
  color text DEFAULT '#C4785A'::text,
  avatar_url text,
  notes text,
  -- Individual fields
  date_of_birth date,
  nationality text,
  tax_residence text,
  -- Couple fields
  matrimonial_regime text,
  marriage_date date,
  marriage_country text,
  -- Company fields
  legal_form text,
  share_capital numeric,
  share_capital_currency text DEFAULT 'EUR'::text,
  -- Trust fields
  trust_type text,
  trustee_name text,
  beneficiaries jsonb,
  -- HUF fields
  karta_name text,
  coparceners jsonb,
  -- Ownership
  owned_by_entity_id uuid,
  ownership_percentage numeric DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint for composite FK references (must be created BEFORE self-FK)
ALTER TABLE public.entities ADD CONSTRAINT entities_id_user_id_unique UNIQUE (id, user_id);

-- Self-referential FK for entities
ALTER TABLE public.entities
  ADD CONSTRAINT entities_owned_by_user_fk
  FOREIGN KEY (owned_by_entity_id, user_id) REFERENCES public.entities(id, user_id);

-- Table: assets
CREATE TABLE public.assets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_id uuid,
  name text NOT NULL,
  type text NOT NULL,
  country text NOT NULL,
  currency text NOT NULL,
  current_value numeric NOT NULL,
  purchase_value numeric,
  purchase_date date,
  certainty text DEFAULT 'certain'::text,
  ownership_percentage numeric DEFAULT 100,
  ownership_allocation jsonb,
  acquisition_type text DEFAULT 'purchase'::text,
  acquisition_from text,
  notes text,
  image_url text,
  -- Real estate fields
  address text,
  latitude numeric,
  longitude numeric,
  size_sqm numeric,
  rooms integer,
  property_type text,
  property_status text DEFAULT 'owned'::text,
  tenure_type text,
  lease_end_date date,
  rental_income numeric,
  -- Off-plan fields
  developer text,
  project_name text,
  unit_number text,
  total_price numeric,
  amount_paid numeric,
  expected_delivery date,
  -- Investment fields
  institution text,
  platform text,
  ticker text,
  quantity numeric,
  -- Bank account fields
  reference_balance numeric,
  reference_date date,
  -- Compliance fields
  is_shariah_compliant boolean DEFAULT false,
  shariah_certification text,
  liquidity_status text DEFAULT 'liquid'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Unique constraint and composite FK for assets
ALTER TABLE public.assets ADD CONSTRAINT assets_id_user_id_unique UNIQUE (id, user_id);
ALTER TABLE public.assets
  ADD CONSTRAINT assets_entity_user_fk
  FOREIGN KEY (entity_id, user_id) REFERENCES public.entities(id, user_id);

-- CHECK constraint for ownership_allocation validation
ALTER TABLE public.assets
  ADD CONSTRAINT assets_ownership_allocation_check
  CHECK (public.validate_ownership_allocation(ownership_allocation));

-- Table: collections
CREATE TABLE public.collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_id uuid,
  name text NOT NULL,
  type text NOT NULL,
  country text NOT NULL,
  currency text NOT NULL,
  current_value numeric NOT NULL,
  purchase_value numeric,
  purchase_date date,
  certainty text DEFAULT 'probable'::text,
  ownership_percentage numeric DEFAULT 100,
  ownership_allocation jsonb,
  acquisition_type text DEFAULT 'purchase'::text,
  acquisition_from text,
  description text,
  notes text,
  image_url text,
  -- Watch/Vehicle fields
  brand text,
  model text,
  year integer,
  -- LP/Fund fields
  fund_name text,
  commitment_amount numeric,
  called_amount numeric,
  distribution_status text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Unique constraint and composite FK for collections
ALTER TABLE public.collections ADD CONSTRAINT collections_id_user_id_unique UNIQUE (id, user_id);
ALTER TABLE public.collections
  ADD CONSTRAINT collections_entity_user_fk
  FOREIGN KEY (entity_id, user_id) REFERENCES public.entities(id, user_id);

-- CHECK constraint for ownership_allocation validation
ALTER TABLE public.collections
  ADD CONSTRAINT collections_ownership_allocation_check
  CHECK (public.validate_ownership_allocation(ownership_allocation));

-- Table: liabilities
CREATE TABLE public.liabilities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- Composite FK and unique constraint for liabilities
ALTER TABLE public.liabilities ADD CONSTRAINT liabilities_id_user_id_unique UNIQUE (id, user_id);
ALTER TABLE public.liabilities
  ADD CONSTRAINT liabilities_entity_user_fk
  FOREIGN KEY (entity_id, user_id) REFERENCES public.entities(id, user_id);
ALTER TABLE public.liabilities
  ADD CONSTRAINT liabilities_asset_user_fk
  FOREIGN KEY (linked_asset_id, user_id) REFERENCES public.assets(id, user_id);

-- Table: receivables
CREATE TABLE public.receivables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_id uuid,
  linked_asset_id uuid,
  name text NOT NULL,
  type text NOT NULL,
  currency text NOT NULL,
  original_amount numeric NOT NULL,
  current_balance numeric NOT NULL,
  debtor_name text NOT NULL,
  debtor_type text,
  debtor_contact text,
  description text,
  issue_date date,
  due_date date,
  repayment_schedule text,
  interest_rate numeric,
  status text NOT NULL DEFAULT 'pending'::text,
  certainty text DEFAULT 'contractual'::text,
  recovery_probability text,
  deposit_type text,
  refund_conditions text,
  last_payment_date date,
  last_payment_amount numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Composite FK and unique constraint for receivables
ALTER TABLE public.receivables ADD CONSTRAINT receivables_id_user_id_unique UNIQUE (id, user_id);
ALTER TABLE public.receivables
  ADD CONSTRAINT receivables_entity_user_fk
  FOREIGN KEY (entity_id, user_id) REFERENCES public.entities(id, user_id);
ALTER TABLE public.receivables
  ADD CONSTRAINT receivables_linked_asset_user_fk
  FOREIGN KEY (linked_asset_id, user_id) REFERENCES public.assets(id, user_id);

-- Table: receivable_payments
CREATE TABLE public.receivable_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receivable_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL,
  payment_date date NOT NULL,
  payment_method text,
  reference text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Composite FK for receivable_payments
ALTER TABLE public.receivable_payments
  ADD CONSTRAINT payments_receivable_user_fk
  FOREIGN KEY (receivable_id, user_id) REFERENCES public.receivables(id, user_id);

-- Table: documents
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_id uuid,
  collection_id uuid,
  liability_id uuid,
  entity_id uuid,
  receivable_id uuid,
  name text NOT NULL,
  type text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
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

-- Composite FKs for documents
ALTER TABLE public.documents
  ADD CONSTRAINT documents_asset_user_fk
  FOREIGN KEY (asset_id, user_id) REFERENCES public.assets(id, user_id);
ALTER TABLE public.documents
  ADD CONSTRAINT documents_collection_user_fk
  FOREIGN KEY (collection_id, user_id) REFERENCES public.collections(id, user_id);
ALTER TABLE public.documents
  ADD CONSTRAINT documents_liability_user_fk
  FOREIGN KEY (liability_id, user_id) REFERENCES public.liabilities(id, user_id);
ALTER TABLE public.documents
  ADD CONSTRAINT documents_entity_user_fk
  FOREIGN KEY (entity_id, user_id) REFERENCES public.entities(id, user_id);
ALTER TABLE public.documents
  ADD CONSTRAINT documents_receivable_user_fk
  FOREIGN KEY (receivable_id, user_id) REFERENCES public.receivables(id, user_id);

-- Table: loan_schedules
CREATE TABLE public.loan_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  liability_id uuid NOT NULL,
  principal_amount numeric NOT NULL,
  interest_rate numeric,
  start_date date NOT NULL,
  end_date date,
  term_months integer,
  payment_frequency text DEFAULT 'monthly'::text,
  monthly_payment numeric,
  total_interest numeric,
  total_cost numeric,
  payments_made integer DEFAULT 0,
  next_payment_date date,
  remaining_principal numeric,
  loan_type text DEFAULT 'amortizing'::text,
  rate_type text DEFAULT 'fixed'::text,
  is_imported boolean DEFAULT false,
  imported_schedule jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Unique constraint and composite FK for loan_schedules (user_id FK is inline above)
ALTER TABLE public.loan_schedules ADD CONSTRAINT loan_schedules_id_user_id_unique UNIQUE (id, user_id);
ALTER TABLE public.loan_schedules
  ADD CONSTRAINT loan_schedules_liability_user_fk
  FOREIGN KEY (liability_id, user_id) REFERENCES public.liabilities(id, user_id);

-- Table: loan_payments
CREATE TABLE public.loan_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- Composite FK for loan_payments (user_id FK is inline above)
ALTER TABLE public.loan_payments
  ADD CONSTRAINT loan_payments_schedule_user_fk
  FOREIGN KEY (loan_schedule_id, user_id) REFERENCES public.loan_schedules(id, user_id);

-- Table: payment_schedules (off-plan property payments)
CREATE TABLE public.payment_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL,
  payment_number integer NOT NULL,
  due_date date NOT NULL,
  amount numeric NOT NULL,
  percentage numeric,
  currency text NOT NULL DEFAULT 'AED'::text,
  description text,
  status text DEFAULT 'pending'::text,
  paid_date date,
  paid_amount numeric,
  payment_reference text,
  receipt_url text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Composite FK for payment_schedules (user_id FK is inline above)
ALTER TABLE public.payment_schedules
  ADD CONSTRAINT schedules_asset_user_fk
  FOREIGN KEY (asset_id, user_id) REFERENCES public.assets(id, user_id);

-- Table: net_worth_history
CREATE TABLE public.net_worth_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- Table: audit_events
CREATE TABLE public.audit_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: shared_access
CREATE TABLE public.shared_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shared_with_email text NOT NULL,
  shared_with_id uuid REFERENCES public.profiles(id),
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Entity indexes
CREATE INDEX IF NOT EXISTS idx_entities_user_id ON public.entities(user_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON public.entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_user_type ON public.entities(user_id, type);

-- Asset indexes
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_entity_id ON public.assets(entity_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON public.assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_user_type ON public.assets(user_id, type);
CREATE INDEX IF NOT EXISTS idx_assets_user_entity ON public.assets(user_id, entity_id);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets(created_at DESC);

-- Collection indexes
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_entity_id ON public.collections(entity_id);
CREATE INDEX IF NOT EXISTS idx_collections_type ON public.collections(type);
CREATE INDEX IF NOT EXISTS idx_collections_user_type ON public.collections(user_id, type);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON public.collections(created_at DESC);

-- Liability indexes
CREATE INDEX IF NOT EXISTS idx_liabilities_user_id ON public.liabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_entity_id ON public.liabilities(entity_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_linked_asset_id ON public.liabilities(linked_asset_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_type ON public.liabilities(type);
CREATE INDEX IF NOT EXISTS idx_liabilities_user_type ON public.liabilities(user_id, type);

-- Receivable indexes
CREATE INDEX IF NOT EXISTS idx_receivables_user_id ON public.receivables(user_id);
CREATE INDEX IF NOT EXISTS idx_receivables_entity_id ON public.receivables(entity_id);
CREATE INDEX IF NOT EXISTS idx_receivables_status ON public.receivables(status);
CREATE INDEX IF NOT EXISTS idx_receivables_due_date ON public.receivables(due_date);
CREATE INDEX IF NOT EXISTS idx_receivables_user_status ON public.receivables(user_id, status);

-- Receivable payment indexes
CREATE INDEX IF NOT EXISTS idx_receivable_payments_user_id ON public.receivable_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_receivable_id ON public.receivable_payments(receivable_id);

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_asset_id ON public.documents(asset_id);
CREATE INDEX IF NOT EXISTS idx_documents_collection_id ON public.documents(collection_id);
CREATE INDEX IF NOT EXISTS idx_documents_liability_id ON public.documents(liability_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity_id ON public.documents(entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_receivable_id ON public.documents(receivable_id);
CREATE INDEX IF NOT EXISTS idx_documents_expiry_date ON public.documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);

-- Loan schedule indexes
CREATE INDEX IF NOT EXISTS idx_loan_schedules_user_id ON public.loan_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_schedules_liability_id ON public.loan_schedules(liability_id);
CREATE INDEX IF NOT EXISTS idx_loan_schedules_next_payment ON public.loan_schedules(next_payment_date);

-- Loan payment indexes
CREATE INDEX IF NOT EXISTS idx_loan_payments_user_id ON public.loan_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_schedule_id ON public.loan_payments(loan_schedule_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_status ON public.loan_payments(status);
CREATE INDEX IF NOT EXISTS idx_loan_payments_date ON public.loan_payments(payment_date);

-- Payment schedule indexes
CREATE INDEX IF NOT EXISTS idx_payment_schedules_user_id ON public.payment_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_asset_id ON public.payment_schedules(asset_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_status ON public.payment_schedules(status);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_date ON public.payment_schedules(due_date);

-- Net worth history indexes
CREATE INDEX IF NOT EXISTS idx_net_worth_history_user_id ON public.net_worth_history(user_id);
CREATE INDEX IF NOT EXISTS idx_net_worth_history_snapshot_date ON public.net_worth_history(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_net_worth_history_user_date ON public.net_worth_history(user_id, snapshot_date DESC);

-- Audit event indexes
CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON public.audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity_type ON public.audit_events(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON public.audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_user_created ON public.audit_events(user_id, created_at DESC);

-- Shared access indexes
CREATE INDEX IF NOT EXISTS idx_shared_access_owner_id ON public.shared_access(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_access_shared_with_id ON public.shared_access(shared_with_id);
CREATE INDEX IF NOT EXISTS idx_shared_access_shared_with_email ON public.shared_access(shared_with_email);
CREATE INDEX IF NOT EXISTS idx_shared_access_status ON public.shared_access(status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

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

-- Audit events policies
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

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_liabilities_updated_at
  BEFORE UPDATE ON public.liabilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_receivables_updated_at
  BEFORE UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_loan_schedules_updated_at
  BEFORE UPDATE ON public.loan_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payment_schedules_updated_at
  BEFORE UPDATE ON public.payment_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Circular ownership prevention
CREATE TRIGGER prevent_circular_ownership
  BEFORE INSERT OR UPDATE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.check_circular_ownership();

-- Default entity creation
CREATE TRIGGER create_default_entity
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_default_entity();

-- Receivable payment auto-update
CREATE TRIGGER update_receivable_balance
  AFTER INSERT ON public.receivable_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_receivable_on_payment();

-- Shared access update restrictions
CREATE TRIGGER enforce_shared_access_restrictions
  BEFORE UPDATE ON public.shared_access
  FOR EACH ROW EXECUTE FUNCTION public.enforce_receiver_update_restrictions();

-- Audit logging triggers
CREATE TRIGGER audit_assets
  AFTER INSERT OR UPDATE OR DELETE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_collections
  AFTER INSERT OR UPDATE OR DELETE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_liabilities
  AFTER INSERT OR UPDATE OR DELETE ON public.liabilities
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_entities
  AFTER INSERT OR UPDATE OR DELETE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_receivables
  AFTER INSERT OR UPDATE OR DELETE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-images', 'asset-images', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Documents bucket policies
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Asset-images bucket policies
CREATE POLICY "Users can view own asset images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own asset images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own asset images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own asset images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- AUTH TRIGGER (Run separately in Supabase Dashboard > SQL Editor)
-- This trigger MUST be created manually as it references auth.users
-- ============================================================================

/*
-- IMPORTANT: Run this AFTER the main schema is applied
-- Go to Supabase Dashboard > SQL Editor > New Query

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

*/

-- ============================================================================
-- END OF SCHEMA EXPORT
-- ============================================================================
