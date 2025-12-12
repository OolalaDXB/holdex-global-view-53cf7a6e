-- Create loan_schedules table for tracking amortization details
CREATE TABLE public.loan_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liability_id UUID REFERENCES public.liabilities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  
  loan_type TEXT DEFAULT 'amortizing' CHECK (loan_type IN ('amortizing', 'bullet', 'balloon', 'interest_only')),
  
  principal_amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,3),
  rate_type TEXT DEFAULT 'fixed' CHECK (rate_type IN ('fixed', 'variable', 'capped')),
  
  start_date DATE NOT NULL,
  end_date DATE,
  term_months INTEGER,
  
  payment_frequency TEXT DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual')),
  monthly_payment DECIMAL(15,2),
  
  total_interest DECIMAL(15,2),
  total_cost DECIMAL(15,2),
  
  payments_made INTEGER DEFAULT 0,
  next_payment_date DATE,
  remaining_principal DECIMAL(15,2),
  
  imported_schedule JSONB,
  is_imported BOOLEAN DEFAULT false,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on loan_schedules
ALTER TABLE public.loan_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies for loan_schedules
CREATE POLICY "Users can view own loan_schedules" ON public.loan_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own loan_schedules" ON public.loan_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own loan_schedules" ON public.loan_schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own loan_schedules" ON public.loan_schedules FOR DELETE USING (auth.uid() = user_id);

-- Create loan_payments table for individual payment tracking
CREATE TABLE public.loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_schedule_id UUID REFERENCES public.loan_schedules(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  
  payment_number INTEGER NOT NULL,
  payment_date DATE NOT NULL,
  
  principal_amount DECIMAL(15,2),
  interest_amount DECIMAL(15,2),
  total_amount DECIMAL(15,2),
  remaining_principal DECIMAL(15,2),
  
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'paid', 'late', 'missed')),
  actual_payment_date DATE,
  actual_amount DECIMAL(15,2),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on loan_payments
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for loan_payments
CREATE POLICY "Users can view own loan_payments" ON public.loan_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own loan_payments" ON public.loan_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own loan_payments" ON public.loan_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own loan_payments" ON public.loan_payments FOR DELETE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_loan_payments_schedule ON public.loan_payments(loan_schedule_id);
CREATE INDEX idx_loan_schedules_liability ON public.loan_schedules(liability_id);

-- Trigger for updated_at on loan_schedules
CREATE TRIGGER update_loan_schedules_updated_at
  BEFORE UPDATE ON public.loan_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();