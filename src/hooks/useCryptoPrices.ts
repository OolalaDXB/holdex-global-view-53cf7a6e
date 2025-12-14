import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CryptoPrices {
  [symbol: string]: {
    price: number;
    change24h: number;
  };
}

type CryptoPriceStatus = 'live' | 'stale' | 'unavailable';

interface CryptoPricesResponse {
  prices: CryptoPrices | null;
  timestamp: number;
  status: CryptoPriceStatus;
  message: string | null;
}

interface UseCryptoPricesResult {
  data: CryptoPrices | null;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  status: CryptoPriceStatus;
  isStale: boolean;
  isUnavailable: boolean;
  message: string | null;
  dataUpdatedAt: number | undefined;
  cacheTimestamp: number | null;
  refetch: () => void;
}

export const useCryptoPrices = (): UseCryptoPricesResult => {
  const query = useQuery({
    queryKey: ['crypto-prices'],
    queryFn: async (): Promise<CryptoPricesResponse> => {
      const { data, error } = await supabase.functions.invoke<CryptoPricesResponse>('crypto-prices');
      
      if (error) {
        console.error('Error fetching crypto prices:', error);
        throw error;
      }
      
      return {
        prices: data?.prices || null,
        timestamp: data?.timestamp || Date.now(),
        status: data?.status || 'unavailable',
        message: data?.message || null,
      };
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    refetchOnWindowFocus: false,
  });

  const responseData = query.data;
  
  return {
    data: responseData?.prices || null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    status: responseData?.status || 'unavailable',
    isStale: responseData?.status === 'stale',
    isUnavailable: responseData?.status === 'unavailable' || !responseData?.prices,
    message: responseData?.message || null,
    dataUpdatedAt: query.dataUpdatedAt,
    cacheTimestamp: responseData?.timestamp || null,
    refetch: () => query.refetch(),
  };
};
