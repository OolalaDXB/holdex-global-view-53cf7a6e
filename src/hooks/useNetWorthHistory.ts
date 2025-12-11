import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type NetWorthHistory = Tables<'net_worth_history'>;

export const useNetWorthHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['net_worth_history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('net_worth_history')
        .select('*')
        .order('snapshot_date', { ascending: true })
        .limit(12);

      if (error) throw error;
      return data as NetWorthHistory[];
    },
    enabled: !!user,
  });
};
