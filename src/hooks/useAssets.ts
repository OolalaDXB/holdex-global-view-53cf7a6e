import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { OwnershipAllocation, parseOwnershipAllocation } from '@/lib/types';
import { useAuditLog } from './useAuditLog';

export type Asset = Tables<'assets'> & {
  parsed_ownership_allocation?: OwnershipAllocation[] | null;
};
export type AssetInsert = TablesInsert<'assets'>;

export const useAssets = (): UseQueryResult<Asset[], Error> => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assets', user?.id],
    queryFn: async (): Promise<Asset[]> => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map(asset => ({
        ...asset,
        parsed_ownership_allocation: parseOwnershipAllocation(asset.ownership_allocation),
      }));
    },
    enabled: !!user,
  });
};

export const useCreateAsset = (): UseMutationResult<Tables<'assets'>, Error, Omit<AssetInsert, 'user_id'>> => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async (asset: Omit<AssetInsert, 'user_id'>): Promise<Tables<'assets'>> => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('assets')
        .insert({ ...asset, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      logEvent({
        action: 'create',
        entityType: 'asset',
        entityId: data.id,
        metadata: { name: data.name, type: data.type },
      });
    },
  });
};

type UpdateAssetParams = Partial<Omit<Asset, 'parsed_ownership_allocation'>> & { id: string };

export const useUpdateAsset = (): UseMutationResult<Tables<'assets'>, Error, UpdateAssetParams> => {
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateAssetParams): Promise<Tables<'assets'>> => {
      const { data, error } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      logEvent({
        action: 'update',
        entityType: 'asset',
        entityId: data.id,
        metadata: { name: data.name, type: data.type },
      });
    },
  });
};

interface DeleteAssetParams {
  id: string;
  name?: string;
}

export const useDeleteAsset = (): UseMutationResult<DeleteAssetParams, Error, DeleteAssetParams> => {
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async ({ id, name }: DeleteAssetParams): Promise<DeleteAssetParams> => {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, name };
    },
    onSuccess: ({ id, name }) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      logEvent({
        action: 'delete',
        entityType: 'asset',
        entityId: id,
        metadata: { name },
      });
    },
  });
};
