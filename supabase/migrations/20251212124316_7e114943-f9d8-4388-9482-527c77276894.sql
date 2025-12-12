-- Add off-plan/VEFA columns to assets table
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS
  property_status TEXT DEFAULT 'owned';

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS
  total_price DECIMAL(15,2);

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS
  amount_paid DECIMAL(15,2);

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS
  expected_delivery DATE;

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS
  developer TEXT;

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS
  unit_number TEXT;

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS
  project_name TEXT;

-- Create payment_schedules table
CREATE TABLE public.payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  
  payment_number INTEGER NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  percentage DECIMAL(5,2),
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'scheduled')),
  paid_date DATE,
  paid_amount DECIMAL(15,2),
  
  payment_reference TEXT,
  receipt_url TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_payment_schedules_asset ON public.payment_schedules(asset_id);
CREATE INDEX idx_payment_schedules_user ON public.payment_schedules(user_id);
CREATE INDEX idx_payment_schedules_due ON public.payment_schedules(due_date);

-- RLS
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment schedules"
  ON public.payment_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment schedules"
  ON public.payment_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment schedules"
  ON public.payment_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment schedules"
  ON public.payment_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_payment_schedules_updated_at
  BEFORE UPDATE ON public.payment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();