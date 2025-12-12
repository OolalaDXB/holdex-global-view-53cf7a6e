import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Receivable = Tables<'receivables'>;
export type ReceivableInsert = TablesInsert<'receivables'>;
export type ReceivableUpdate = TablesUpdate<'receivables'>;
export type ReceivablePayment = Tables<'receivable_payments'>;
export type ReceivablePaymentInsert = TablesInsert<'receivable_payments'>;

export function useReceivables() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['receivables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receivables')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data as Receivable[];
    },
    enabled: !!user,
  });
}

export function useCreateReceivable() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (receivable: Omit<ReceivableInsert, 'user_id'>) => {
      const { data, error } = await supabase
        .from('receivables')
        .insert({ ...receivable, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
    },
  });
}

export function useUpdateReceivable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: ReceivableUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('receivables')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
    },
  });
}

export function useDeleteReceivable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('receivables')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
    },
  });
}

export function useReceivablePayments(receivableId: string) {
  return useQuery({
    queryKey: ['receivable_payments', receivableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receivable_payments')
        .select('*')
        .eq('receivable_id', receivableId)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data as ReceivablePayment[];
    },
    enabled: !!receivableId,
  });
}

export function useCreateReceivablePayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (payment: Omit<ReceivablePaymentInsert, 'user_id'>) => {
      const { data, error } = await supabase
        .from('receivable_payments')
        .insert({ ...payment, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['receivable_payments', variables.receivable_id] });
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
    },
  });
}
