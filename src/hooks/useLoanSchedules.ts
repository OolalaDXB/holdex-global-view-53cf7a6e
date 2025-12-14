import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuditLog } from '@/hooks/useAuditLog';

export type LoanSchedule = Tables<'loan_schedules'>;
export type LoanPayment = Tables<'loan_payments'>;
export type LoanScheduleInsert = TablesInsert<'loan_schedules'>;
export type LoanPaymentInsert = TablesInsert<'loan_payments'>;

export interface AmortizationEntry {
  payment_number: number;
  payment_date: string;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  remaining_principal: number;
}

export type PaymentFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

// Calculate monthly payment using standard amortization formula
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (annualRate === 0) {
    return principal / termMonths;
  }
  const monthlyRate = annualRate / 100 / 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                  (Math.pow(1 + monthlyRate, termMonths) - 1);
  return Math.round(payment * 100) / 100;
}

// Generate full amortization schedule
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
  startDate: Date,
  frequency: PaymentFrequency = 'monthly'
): AmortizationEntry[] {
  const schedule: AmortizationEntry[] = [];
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  
  let remainingPrincipal = principal;
  const currentDate = new Date(startDate);
  
  const monthsPerPayment: Record<PaymentFrequency, number> = {
    monthly: 1,
    quarterly: 3,
    semi_annual: 6,
    annual: 12
  };
  
  const paymentInterval = monthsPerPayment[frequency];
  const totalPayments = Math.ceil(termMonths / paymentInterval);
  const paymentAmount = monthlyPayment * paymentInterval;
  const periodRate = monthlyRate * paymentInterval;
  
  for (let i = 1; i <= totalPayments && remainingPrincipal > 0.01; i++) {
    const interestAmount = remainingPrincipal * periodRate;
    let principalAmount = paymentAmount - interestAmount;
    
    // Last payment adjustment
    if (principalAmount > remainingPrincipal) {
      principalAmount = remainingPrincipal;
    }
    
    remainingPrincipal -= principalAmount;
    if (remainingPrincipal < 0) remainingPrincipal = 0;
    
    schedule.push({
      payment_number: i,
      payment_date: currentDate.toISOString().split('T')[0] ?? '',
      principal_amount: Math.round(principalAmount * 100) / 100,
      interest_amount: Math.round(interestAmount * 100) / 100,
      total_amount: Math.round((principalAmount + interestAmount) * 100) / 100,
      remaining_principal: Math.round(remainingPrincipal * 100) / 100
    });
    
    currentDate.setMonth(currentDate.getMonth() + paymentInterval);
  }
  
  return schedule;
}

export function useLoanSchedule(liabilityId: string | null | undefined): UseQueryResult<LoanSchedule | null, Error> {
  return useQuery({
    queryKey: ['loan-schedule', liabilityId],
    queryFn: async (): Promise<LoanSchedule | null> => {
      if (!liabilityId) return null;
      
      const { data, error } = await supabase
        .from('loan_schedules')
        .select('*')
        .eq('liability_id', liabilityId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!liabilityId,
  });
}

export function useLoanPayments(scheduleId: string | null | undefined): UseQueryResult<LoanPayment[], Error> {
  return useQuery({
    queryKey: ['loan-payments', scheduleId],
    queryFn: async (): Promise<LoanPayment[]> => {
      if (!scheduleId) return [];
      
      const { data, error } = await supabase
        .from('loan_payments')
        .select('*')
        .eq('loan_schedule_id', scheduleId)
        .order('payment_number', { ascending: true });
      
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!scheduleId,
  });
}

interface UpcomingLoanPayment extends LoanPayment {
  loan_schedules: {
    liability_id: string;
    liabilities: {
      name: string;
      currency: string;
    };
  };
}

export function useAllUpcomingLoanPayments(): UseQueryResult<UpcomingLoanPayment[], Error> {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['upcoming-loan-payments', user?.id],
    queryFn: async (): Promise<UpcomingLoanPayment[]> => {
      if (!user?.id) return [];
      
      const today = new Date().toISOString().split('T')[0] ?? '';
      
      const { data, error } = await supabase
        .from('loan_payments')
        .select(`
          *,
          loan_schedules!inner(
            liability_id,
            liabilities!inner(name, currency)
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('payment_date', today)
        .order('payment_date', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return (data ?? []) as UpcomingLoanPayment[];
    },
    enabled: !!user?.id,
  });
}

type CreateLoanScheduleParams = Omit<LoanSchedule, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function useCreateLoanSchedule(): UseMutationResult<LoanSchedule, Error, CreateLoanScheduleParams> {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { logEvent } = useAuditLog();
  
  return useMutation({
    mutationFn: async (schedule: CreateLoanScheduleParams): Promise<LoanSchedule> => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('loan_schedules')
        .insert({ ...schedule, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loan-schedule', data.liability_id] });
      logEvent({
        action: 'create',
        entityType: 'loan_schedule',
        entityId: data.id,
        metadata: { liability_id: data.liability_id, principal: data.principal_amount },
      });
    },
  });
}

type UpdateLoanScheduleParams = Partial<LoanSchedule> & { id: string };

export function useUpdateLoanSchedule(): UseMutationResult<LoanSchedule, Error, UpdateLoanScheduleParams> {
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateLoanScheduleParams): Promise<LoanSchedule> => {
      const { data, error } = await supabase
        .from('loan_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loan-schedule', data.liability_id] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-loan-payments'] });
      logEvent({
        action: 'update',
        entityType: 'loan_schedule',
        entityId: data.id,
        metadata: { liability_id: data.liability_id },
      });
    },
  });
}

interface DeleteLoanScheduleParams {
  id: string;
  liabilityId?: string;
}

export function useDeleteLoanSchedule(): UseMutationResult<DeleteLoanScheduleParams, Error, DeleteLoanScheduleParams> {
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();
  
  return useMutation({
    mutationFn: async ({ id, liabilityId }: DeleteLoanScheduleParams): Promise<DeleteLoanScheduleParams> => {
      const { error } = await supabase
        .from('loan_schedules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, liabilityId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loan-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['loan-payments'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-loan-payments'] });
      logEvent({
        action: 'delete',
        entityType: 'loan_schedule',
        entityId: data.id,
        metadata: { liability_id: data.liabilityId },
      });
    },
  });
}

type CreateLoanPaymentsParams = Omit<LoanPayment, 'id' | 'user_id' | 'created_at'>[];

export function useCreateLoanPayments(): UseMutationResult<LoanPayment[], Error, CreateLoanPaymentsParams> {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { logEvent } = useAuditLog();
  
  return useMutation({
    mutationFn: async (payments: CreateLoanPaymentsParams): Promise<LoanPayment[]> => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const paymentsWithUser = payments.map(p => ({ ...p, user_id: user.id }));
      
      const { data, error } = await supabase
        .from('loan_payments')
        .insert(paymentsWithUser)
        .select();
      
      if (error) throw error;
      return data ?? [];
    },
    onSuccess: (data) => {
      if (data.length > 0) {
        const firstPayment = data[0];
        if (firstPayment) {
          queryClient.invalidateQueries({ queryKey: ['loan-payments', firstPayment.loan_schedule_id] });
        }
        queryClient.invalidateQueries({ queryKey: ['upcoming-loan-payments'] });
        logEvent({
          action: 'create',
          entityType: 'loan_payment',
          entityId: firstPayment?.loan_schedule_id ?? null,
          metadata: { count: data.length },
        });
      }
    },
  });
}

interface MarkPaymentPaidParams {
  paymentId: string;
  scheduleId: string;
  actualAmount?: number;
  actualDate?: string;
}

interface MarkPaymentPaidResult {
  paymentId: string;
  scheduleId: string;
  actualAmount?: number;
}

export function useMarkPaymentPaid(): UseMutationResult<MarkPaymentPaidResult, Error, MarkPaymentPaidParams> {
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();
  
  return useMutation({
    mutationFn: async ({ 
      paymentId, 
      scheduleId,
      actualAmount,
      actualDate 
    }: MarkPaymentPaidParams): Promise<MarkPaymentPaidResult> => {
      const today = new Date().toISOString().split('T')[0] ?? '';
      
      // Update the payment
      const { error: paymentError } = await supabase
        .from('loan_payments')
        .update({
          status: 'paid',
          actual_payment_date: actualDate ?? today,
          actual_amount: actualAmount,
        })
        .eq('id', paymentId);
      
      if (paymentError) throw paymentError;
      
      // Get current schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from('loan_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();
      
      if (scheduleError) throw scheduleError;
      
      // Get next unpaid payment
      const { data: nextPayment } = await supabase
        .from('loan_payments')
        .select('payment_date, remaining_principal')
        .eq('loan_schedule_id', scheduleId)
        .eq('status', 'scheduled')
        .order('payment_number', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      // Get the payment we just marked as paid to get remaining principal
      const { data: paidPayment } = await supabase
        .from('loan_payments')
        .select('remaining_principal')
        .eq('id', paymentId)
        .single();
      
      // Update schedule
      const { error: updateError } = await supabase
        .from('loan_schedules')
        .update({
          payments_made: (schedule.payments_made ?? 0) + 1,
          next_payment_date: nextPayment?.payment_date ?? null,
          remaining_principal: paidPayment?.remaining_principal ?? schedule.remaining_principal,
        })
        .eq('id', scheduleId);
      
      if (updateError) throw updateError;
      
      return { paymentId, scheduleId, actualAmount };
    },
    onSuccess: ({ paymentId, actualAmount }) => {
      queryClient.invalidateQueries({ queryKey: ['loan-payments'] });
      queryClient.invalidateQueries({ queryKey: ['loan-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-loan-payments'] });
      logEvent({
        action: 'update',
        entityType: 'loan_payment',
        entityId: paymentId,
        metadata: { status: 'paid', amount: actualAmount },
      });
    },
  });
}
