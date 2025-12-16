-- Add shared_access support to documents SELECT policy
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents"
ON public.documents
FOR SELECT
USING (
  user_id = auth.uid() 
  OR user_id IN (
    SELECT owner_id FROM public.shared_access 
    WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
);

-- Add shared_access support to entities SELECT policy
DROP POLICY IF EXISTS "Users can view own entities" ON public.entities;
CREATE POLICY "Users can view own entities"
ON public.entities
FOR SELECT
USING (
  user_id = auth.uid() 
  OR user_id IN (
    SELECT owner_id FROM public.shared_access 
    WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
);

-- Add shared_access support to payment_schedules SELECT policy
DROP POLICY IF EXISTS "Users can view own payment schedules" ON public.payment_schedules;
CREATE POLICY "Users can view own payment schedules"
ON public.payment_schedules
FOR SELECT
USING (
  user_id = auth.uid() 
  OR user_id IN (
    SELECT owner_id FROM public.shared_access 
    WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
);

-- Add shared_access support to loan_schedules SELECT policy
DROP POLICY IF EXISTS "Users can view own loan_schedules" ON public.loan_schedules;
CREATE POLICY "Users can view own loan_schedules"
ON public.loan_schedules
FOR SELECT
USING (
  user_id = auth.uid() 
  OR user_id IN (
    SELECT owner_id FROM public.shared_access 
    WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
);

-- Add shared_access support to loan_payments SELECT policy
DROP POLICY IF EXISTS "Users can view own loan_payments" ON public.loan_payments;
CREATE POLICY "Users can view own loan_payments"
ON public.loan_payments
FOR SELECT
USING (
  user_id = auth.uid() 
  OR user_id IN (
    SELECT owner_id FROM public.shared_access 
    WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
);

-- Add shared_access support to receivable_payments SELECT policy
DROP POLICY IF EXISTS "Users can view own payments" ON public.receivable_payments;
CREATE POLICY "Users can view own payments"
ON public.receivable_payments
FOR SELECT
USING (
  (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.receivables r 
    WHERE r.id = receivable_payments.receivable_id AND r.user_id = auth.uid()
  ))
  OR user_id IN (
    SELECT owner_id FROM public.shared_access 
    WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
);