import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SnapshotData {
  total_assets_eur: number;
  total_collections_eur: number;
  total_liabilities_eur: number;
  net_worth_eur: number;
  breakdown_by_type: Record<string, number>;
  breakdown_by_country: Record<string, number>;
  breakdown_by_currency: Record<string, number>;
  exchange_rates_snapshot?: Record<string, number>;
  crypto_prices_snapshot?: Record<string, { price: number; change24h: number }>;
}

export const useSaveSnapshot = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: SnapshotData) => {
      if (!user) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];

      // Check if snapshot already exists for today
      const { data: existing } = await supabase
        .from('net_worth_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('snapshot_date', today)
        .maybeSingle();

      if (existing) {
        // Update existing snapshot
        const { data: updated, error } = await supabase
          .from('net_worth_history')
          .update({
            total_assets_eur: data.total_assets_eur,
            total_collections_eur: data.total_collections_eur,
            total_liabilities_eur: data.total_liabilities_eur,
            net_worth_eur: data.net_worth_eur,
            breakdown_by_type: data.breakdown_by_type,
            breakdown_by_country: data.breakdown_by_country,
            breakdown_by_currency: data.breakdown_by_currency,
            exchange_rates_snapshot: data.exchange_rates_snapshot,
            crypto_prices_snapshot: data.crypto_prices_snapshot,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return updated;
      } else {
        // Create new snapshot
        const { data: created, error } = await supabase
          .from('net_worth_history')
          .insert({
            user_id: user.id,
            snapshot_date: today,
            total_assets_eur: data.total_assets_eur,
            total_collections_eur: data.total_collections_eur,
            total_liabilities_eur: data.total_liabilities_eur,
            net_worth_eur: data.net_worth_eur,
            breakdown_by_type: data.breakdown_by_type,
            breakdown_by_country: data.breakdown_by_country,
            breakdown_by_currency: data.breakdown_by_currency,
            exchange_rates_snapshot: data.exchange_rates_snapshot,
            crypto_prices_snapshot: data.crypto_prices_snapshot,
          })
          .select()
          .single();

        if (error) throw error;
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['net-worth-history'] });
    },
  });
};
