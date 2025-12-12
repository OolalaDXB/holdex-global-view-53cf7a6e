import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PaymentSchedule {
  id: string;
  asset_id: string;
  user_id: string;
  payment_number: number;
  description: string | null;
  due_date: string;
  amount: number;
  currency: string;
  percentage: number | null;
  status: 'pending' | 'paid' | 'overdue' | 'scheduled';
  paid_date: string | null;
  paid_amount: number | null;
  payment_reference: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentScheduleInsert = Omit<PaymentSchedule, 'id' | 'created_at' | 'updated_at'>;

export function usePaymentSchedules(assetId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payment-schedules', assetId],
    queryFn: async () => {
      if (!assetId) return [];
      
      const { data, error } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('asset_id', assetId)
        .order('payment_number', { ascending: true });

      if (error) throw error;
      return data as PaymentSchedule[];
    },
    enabled: !!user && !!assetId,
  });
}

export function useCreatePaymentSchedule() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payment: Omit<PaymentScheduleInsert, 'user_id'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('payment_schedules')
        .insert({ ...payment, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules', data.asset_id] });
    },
  });
}

export function useUpdatePaymentSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from('payment_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules', data.asset_id] });
    },
  });
}

export function useDeletePaymentSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, assetId }: { id: string; assetId: string }) => {
      const { error } = await supabase
        .from('payment_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { assetId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules', data.assetId] });
    },
  });
}

export function useBulkCreatePaymentSchedules() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payments: Omit<PaymentScheduleInsert, 'user_id'>[]) => {
      if (!user) throw new Error('User not authenticated');

      const paymentsWithUser = payments.map(p => ({ ...p, user_id: user.id }));

      const { data, error } = await supabase
        .from('payment_schedules')
        .insert(paymentsWithUser)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['payment-schedules', data[0].asset_id] });
      }
    },
  });
}
