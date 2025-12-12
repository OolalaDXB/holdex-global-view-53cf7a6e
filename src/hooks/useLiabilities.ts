import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type Liability = Tables<'liabilities'>;
export type LiabilityInsert = TablesInsert<'liabilities'>;

// Centralized liability types with icon names
export const LIABILITY_TYPES = [
  { value: 'mortgage', label: 'Mortgage', icon: 'Home' },
  { value: 'car_loan', label: 'Vehicle Loan', icon: 'Car' },
  { value: 'personal_loan', label: 'Personal Loan', icon: 'Wallet' },
  { value: 'student_loan', label: 'Student Loan', icon: 'GraduationCap' },
  { value: 'business_loan', label: 'Business Loan', icon: 'Briefcase' },
  { value: 'credit_card', label: 'Credit Card', icon: 'CreditCard' },
  { value: 'line_of_credit', label: 'Line of Credit', icon: 'ArrowLeftRight' },
  { value: 'margin_loan', label: 'Margin Loan', icon: 'LineChart' },
  { value: 'tax_debt', label: 'Tax Debt', icon: 'Receipt' },
  { value: 'family_loan', label: 'Family Loan', icon: 'Heart' },
  { value: 'other', label: 'Other', icon: 'CircleDashed' },
] as const;

export const getLiabilityTypeInfo = (type: string) => 
  LIABILITY_TYPES.find(t => t.value === type) || LIABILITY_TYPES[LIABILITY_TYPES.length - 1];

export const FINANCING_TYPES = [
  { value: 'conventional', label: 'Conventional', description: 'Standard interest-based financing', compliance: null },
  { value: 'ijara', label: 'Ijara', description: 'Islamic lease-to-own', compliance: 'islamic' },
  { value: 'murabaha', label: 'Murabaha', description: 'Islamic cost-plus financing', compliance: 'islamic' },
  { value: 'diminishing_musharaka', label: 'Diminishing Musharaka', description: 'Islamic co-ownership', compliance: 'islamic' },
  { value: 'istisna', label: 'Istisna', description: 'Islamic construction financing', compliance: 'islamic' },
  { value: 'qard_hassan', label: 'Qard Hassan', description: 'Interest-free loan', compliance: 'islamic' },
  { value: 'heter_iska', label: 'Heter Iska', description: 'Jewish partnership structure', compliance: 'jewish' },
  { value: 'other_compliant', label: 'Other Compliant', description: 'Other ethical/religious compliant', compliance: 'all' },
] as const;

export const isIslamicFinancing = (type: string) => 
  ['ijara', 'murabaha', 'diminishing_musharaka', 'istisna', 'qard_hassan'].includes(type);

export const getFilteredFinancingTypes = (showIslamic: boolean, showJewish: boolean) => {
  return FINANCING_TYPES.filter(type => {
    if (type.compliance === null) return true; // Always show conventional
    if (type.compliance === 'islamic') return showIslamic;
    if (type.compliance === 'jewish') return showJewish;
    if (type.compliance === 'all') return showIslamic || showJewish;
    return false;
  });
};

export const useLiabilities = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['liabilities', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('liabilities')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Liability[];
    },
    enabled: !!user,
  });
};

export const useCreateLiability = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (liability: Omit<LiabilityInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('liabilities')
        .insert({ ...liability, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
    },
  });
};

export const useUpdateLiability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Omit<LiabilityInsert, 'user_id'>>) => {
      const { data, error } = await supabase
        .from('liabilities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
    },
  });
};

export const useDeleteLiability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('liabilities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
    },
  });
};
