import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type SharedAccess = Tables<'shared_access'>;

export const useSharedAccess = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shared_access', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_access')
        .select('*')
        .eq('owner_id', user?.id || '');

      if (error) throw error;
      return data as SharedAccess[];
    },
    enabled: !!user,
  });
};

// Hook to get invitations received by the current user
export const useReceivedInvitations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['received_invitations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_access')
        .select('*')
        .eq('shared_with_id', user?.id || '');

      if (error) throw error;
      return data as SharedAccess[];
    },
    enabled: !!user,
  });
};

export const useInvitePartner = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('shared_access')
        .insert({
          owner_id: user.id,
          shared_with_email: email,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared_access'] });
    },
  });
};

export const useRevokeAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shared_access')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared_access'] });
    },
  });
};

// Hook to accept or decline an invitation
export const useRespondToInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'declined' }) => {
      const { error } = await supabase
        .from('shared_access')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received_invitations'] });
      queryClient.invalidateQueries({ queryKey: ['shared_access'] });
    },
  });
};
