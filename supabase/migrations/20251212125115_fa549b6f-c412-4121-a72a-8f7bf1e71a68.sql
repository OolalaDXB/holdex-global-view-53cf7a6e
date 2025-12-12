-- Create receivables table
CREATE TABLE public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Type
  type TEXT NOT NULL CHECK (type IN ('personal_loan', 'business_loan', 'expense_reimbursement', 'deposit', 'advance', 'other')),
  
  -- Debtor info
  debtor_name TEXT NOT NULL,
  debtor_type TEXT CHECK (debtor_type IN ('individual', 'company', 'employer', 'landlord', 'service_provider')),
  debtor_contact TEXT,
  
  -- Amounts
  currency TEXT NOT NULL,
  original_amount DECIMAL(15,2) NOT NULL,
  current_balance DECIMAL(15,2) NOT NULL,
  
  -- Dates
  issue_date DATE,
  due_date DATE,
  
  -- Terms
  repayment_schedule TEXT CHECK (repayment_schedule IN ('one_time', 'monthly', 'quarterly', 'flexible')),
  interest_rate DECIMAL(5,2),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'written_off', 'disputed')),
  recovery_probability TEXT CHECK (recovery_probability IN ('certain', 'likely', 'uncertain', 'doubtful')),
  
  -- For deposits
  linked_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  deposit_type TEXT CHECK (deposit_type IN ('rental', 'utility', 'service', 'security')),
  refund_conditions TEXT,
  
  -- Payment tracking
  last_payment_date DATE,
  last_payment_amount DECIMAL(15,2),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create receivable_payments table
CREATE TABLE public.receivable_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_id UUID NOT NULL REFERENCES public.receivables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'cash', 'check', 'crypto', 'other')),
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_receivables_user ON public.receivables(user_id);
CREATE INDEX idx_receivables_status ON public.receivables(status);
CREATE INDEX idx_receivables_due_date ON public.receivables(due_date);
CREATE INDEX idx_receivable_payments_receivable ON public.receivable_payments(receivable_id);

-- Enable RLS
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivable_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for receivables
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

-- RLS policies for receivable_payments
CREATE POLICY "Users can view own payments" ON public.receivable_payments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments" ON public.receivable_payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payments" ON public.receivable_payments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own payments" ON public.receivable_payments
  FOR DELETE USING (user_id = auth.uid());

-- Trigger to update receivable on payment
CREATE OR REPLACE FUNCTION public.update_receivable_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the receivable's balance and payment info
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
$$;

CREATE TRIGGER after_receivable_payment_insert
  AFTER INSERT ON public.receivable_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_receivable_on_payment();

-- Trigger for updated_at
CREATE TRIGGER update_receivables_updated_at
  BEFORE UPDATE ON public.receivables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();