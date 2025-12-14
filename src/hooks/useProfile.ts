import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

// Type definition for FavoriteCity
export interface FavoriteCity {
  name: string;
  timezone: string;
}

// Zod schemas for runtime validation of JSON fields
export const FavoriteCitySchema = z.object({
  name: z.string(),
  timezone: z.string(),
});

export const DashboardWidgetSchema = z.string();

export const NewsSourceSchema = z.string();

// Base profile from database
type BaseProfile = Tables<'profiles'>;

// Extended profile with properly typed JSON fields
export interface Profile extends Omit<BaseProfile, 'favorite_cities' | 'dashboard_widgets' | 'news_sources'> {
  favorite_cities: FavoriteCity[] | null;
  dashboard_widgets: string[] | null;
  news_sources: string[] | null;
}

// Safe parse helper that returns default on failure with proper type casting
const parseFavoriteCities = (data: unknown): FavoriteCity[] | null => {
  if (!Array.isArray(data)) return null;
  
  const result = z.array(FavoriteCitySchema).safeParse(data);
  if (!result.success) return null;
  
  // Explicitly cast to our interface type (zod's inference can be imprecise)
  return result.data.map(city => ({
    name: city.name,
    timezone: city.timezone,
  }));
};

const parseStringArray = (data: unknown): string[] | null => {
  if (!Array.isArray(data)) return null;
  
  const result = z.array(z.string()).safeParse(data);
  return result.success ? result.data : null;
};

// Helper to parse and validate the profile data at runtime
const parseProfile = (data: BaseProfile | null): Profile | null => {
  if (!data) return null;
  
  return {
    ...data,
    favorite_cities: parseFavoriteCities(data.favorite_cities),
    dashboard_widgets: parseStringArray(data.dashboard_widgets),
    news_sources: parseStringArray(data.news_sources),
  };
};

export const useProfile = (): UseQueryResult<Profile | null, Error> => {
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

type ProfileUpdateParams = Partial<Omit<BaseProfile, 'id' | 'created_at'>>;

export const useUpdateProfile = (): UseMutationResult<Profile | null, Error, ProfileUpdateParams> => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: ProfileUpdateParams): Promise<Profile | null> => {
      if (!user) throw new Error('Not authenticated');
      
      // Use upsert to create profile if it doesn't exist
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email ?? '',
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
