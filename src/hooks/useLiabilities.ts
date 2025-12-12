import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type Liability = Tables<'liabilities'>;
export type LiabilityInsert = TablesInsert<'liabilities'>;

export const FINANCING_TYPES = [
  { value: 'conventional', label: 'Conventional', description: 'Standard interest-based financing' },
  { value: 'ijara', label: 'Ijara', description: 'Islamic lease-to-own' },
  { value: 'murabaha', label: 'Murabaha', description: 'Islamic cost-plus financing' },
  { value: 'diminishing_musharaka', label: 'Diminishing Musharaka', description: 'Islamic co-ownership' },
  { value: 'istisna', label: 'Istisna', description: 'Islamic construction financing' },
  { value: 'qard_hassan', label: 'Qard Hassan', description: 'Interest-free loan' },
  { value: 'heter_iska', label: 'Heter Iska', description: 'Jewish partnership structure' },
  { value: 'other_compliant', label: 'Other Compliant', description: 'Other ethical/religious compliant' },
] as const;

export const isIslamicFinancing = (type: string) => 
  ['ijara', 'murabaha', 'diminishing_musharaka', 'istisna', 'qard_hassan'].includes(type);

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
