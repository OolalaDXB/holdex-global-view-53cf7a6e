import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { OwnershipAllocation, parseOwnershipAllocation } from '@/lib/types';

export type Asset = Tables<'assets'> & {
  parsed_ownership_allocation?: OwnershipAllocation[] | null;
};
export type AssetInsert = TablesInsert<'assets'>;

export const useAssets = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map(asset => ({
        ...asset,
        parsed_ownership_allocation: parseOwnershipAllocation(asset.ownership_allocation),
      })) as Asset[];
    },
    enabled: !!user,
  });
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (asset: Omit<AssetInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('assets')
        .insert({ ...asset, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Asset> & { id: string }) => {
      const { data, error } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};
