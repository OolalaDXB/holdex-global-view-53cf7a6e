-- Drop existing constraint if it exists and add new one with expanded types
ALTER TABLE public.liabilities DROP CONSTRAINT IF EXISTS liabilities_type_check;
ALTER TABLE public.liabilities ADD CONSTRAINT liabilities_type_check 
  CHECK (type IN ('mortgage', 'car_loan', 'personal_loan', 'student_loan', 'business_loan', 'credit_card', 'line_of_credit', 'margin_loan', 'tax_debt', 'family_loan', 'other', 'loan'));