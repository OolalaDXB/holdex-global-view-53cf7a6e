import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type Liability = Tables<'liabilities'>;
export type LiabilityInsert = TablesInsert<'liabilities'>;

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
