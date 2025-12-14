import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

// Typed interfaces for JSON fields
export interface FavoriteCity {
  name: string;
  timezone: string;
}

export interface DashboardWidgets {
  enabled: string[];
}

// Base profile from database
type BaseProfile = Tables<'profiles'>;

// Extended profile with properly typed JSON fields
export interface Profile extends Omit<BaseProfile, 'favorite_cities' | 'dashboard_widgets' | 'news_sources'> {
  favorite_cities: FavoriteCity[] | null;
  dashboard_widgets: string[] | null;
  news_sources: string[] | null;
}

// Helper to parse and type the profile data
const parseProfile = (data: BaseProfile | null): Profile | null => {
  if (!data) return null;
  
  return {
    ...data,
    favorite_cities: Array.isArray(data.favorite_cities) 
      ? (data.favorite_cities as unknown as FavoriteCity[]) 
      : null,
    dashboard_widgets: Array.isArray(data.dashboard_widgets) 
      ? (data.dashboard_widgets as unknown as string[]) 
      : null,
    news_sources: Array.isArray(data.news_sources) 
      ? (data.news_sources as unknown as string[]) 
      : null,
  };
};

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      return parseProfile(data);
    },
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<BaseProfile, 'id' | 'created_at'>>) => {
      if (!user) throw new Error('Not authenticated');
      
      // Use upsert to create profile if it doesn't exist
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          ...updates,
        })
        .select()
        .single();

      if (error) throw error;
      return parseProfile(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
