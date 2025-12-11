import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CryptoPrices {
  [symbol: string]: {
    price: number;
    change24h: number;
  };
}

interface CryptoPricesResponse {
  prices: CryptoPrices;
  timestamp: number;
}

export const useCryptoPrices = () => {
  return useQuery({
    queryKey: ['crypto-prices'],
    queryFn: async (): Promise<CryptoPrices> => {
      const { data, error } = await supabase.functions.invoke<CryptoPricesResponse>('crypto-prices');
      
      if (error) {
        console.error('Error fetching crypto prices:', error);
        throw error;
      }
      
      return data?.prices || {};
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Fallback prices in case API is unavailable
export const fallbackCryptoPrices: CryptoPrices = {
  BTC: { price: 100000, change24h: 0 },
  ETH: { price: 3500, change24h: 0 },
  SOL: { price: 180, change24h: 0 },
  USDT: { price: 1, change24h: 0 },
  USDC: { price: 1, change24h: 0 },
  BNB: { price: 600, change24h: 0 },
  XRP: { price: 2.2, change24h: 0 },
  ADA: { price: 0.9, change24h: 0 },
  DOGE: { price: 0.35, change24h: 0 },
  MATIC: { price: 0.5, change24h: 0 },
};
