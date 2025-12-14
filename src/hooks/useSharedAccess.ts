import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from './useAuditLog';

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

// Hook to get invitations received by the current user (with owner profile info)
export const useReceivedInvitations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['received_invitations', user?.id],
    queryFn: async () => {
      // First get invitations where shared_with_id matches current user
      const { data: invitations, error } = await supabase
        .from('shared_access')
        .select('*')
        .eq('shared_with_id', user?.id || '');

      if (error) throw error;
      
      // Then fetch owner profiles for each invitation
      if (invitations && invitations.length > 0) {
        const ownerIds = [...new Set(invitations.map(inv => inv.owner_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', ownerIds);
        
        if (profilesError) throw profilesError;
        
        // Merge profile info into invitations
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        return invitations.map(inv => ({
          ...inv,
          owner_profile: profileMap.get(inv.owner_id) || null,
        }));
      }
      
      return invitations?.map(inv => ({ ...inv, owner_profile: null })) || [];
    },
    enabled: !!user,
  });
};

// Extended type for invitations with owner profile
export type ReceivedInvitation = SharedAccess & {
  owner_profile: { id: string; full_name: string | null; email: string } | null;
};

// Hook to fetch a specific user's profile (for viewing shared portfolios)
export const useSharedOwnerProfile = (ownerId: string | null) => {
  return useQuery({
    queryKey: ['shared_owner_profile', ownerId],
    queryFn: async () => {
      if (!ownerId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', ownerId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!ownerId,
  });
};

export const useInvitePartner = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { logEvent } = useAuditLog();

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shared_access'] });
      logEvent({
        action: 'create',
        entityType: 'shared_access',
        entityId: data.id,
        metadata: { shared_with_email: data.shared_with_email },
      });
    },
  });
};

export const useRevokeAccess = () => {
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shared_access')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['shared_access'] });
      logEvent({
        action: 'delete',
        entityType: 'shared_access',
        entityId: id,
      });
    },
  });
};

// Hook to accept or decline an invitation
export const useRespondToInvitation = () => {
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'declined' }) => {
      const { error } = await supabase
        .from('shared_access')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      return { id, status };
    },
    onSuccess: ({ id, status }) => {
      queryClient.invalidateQueries({ queryKey: ['received_invitations'] });
      queryClient.invalidateQueries({ queryKey: ['shared_access'] });
      logEvent({
        action: 'update',
        entityType: 'shared_access',
        entityId: id,
        metadata: { status },
      });
    },
  });
};
