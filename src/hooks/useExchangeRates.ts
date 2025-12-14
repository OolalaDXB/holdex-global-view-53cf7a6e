import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type ExchangeRateStatus = 'live' | 'stale' | 'unavailable';

interface ExchangeRatesResponse {
  rates: Record<string, number> | null;
  baseCurrency: string;
  lastUpdated: string | null;
  timestamp: number;
  status: ExchangeRateStatus;
  message: string | null;
}

export interface ExchangeRates {
  rates: Record<string, number> | null;
  baseCurrency: string;
  lastUpdated: string | null;
}

interface UseExchangeRatesResult {
  data: ExchangeRates | null;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  status: ExchangeRateStatus;
  isStale: boolean;
  isUnavailable: boolean;
  message: string | null;
  dataUpdatedAt: number | undefined;
  cacheTimestamp: number | null;
  refetch: () => void;
}

// Fetch rates with EUR as base (for consistency with app)
export const useExchangeRates = (): UseExchangeRatesResult => {
  const query = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async (): Promise<ExchangeRatesResponse> => {
      const { data, error } = await supabase.functions.invoke<ExchangeRatesResponse>('exchange-rates');
      
      if (error) {
        console.error('Error fetching exchange rates:', error);
        throw error;
      }
      
      return {
        rates: data?.rates || null,
        baseCurrency: data?.baseCurrency || 'EUR',
        lastUpdated: data?.lastUpdated || null,
        timestamp: data?.timestamp || Date.now(),
        status: data?.status || 'unavailable',
        message: data?.message || null,
      };
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    refetchOnWindowFocus: false,
  });

  const responseData = query.data;
  
  return {
    data: responseData ? {
      rates: responseData.rates,
      baseCurrency: responseData.baseCurrency,
      lastUpdated: responseData.lastUpdated,
    } : null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    status: responseData?.status || 'unavailable',
    isStale: responseData?.status === 'stale',
    isUnavailable: responseData?.status === 'unavailable' || !responseData?.rates,
    message: responseData?.message || null,
    dataUpdatedAt: query.dataUpdatedAt,
    cacheTimestamp: responseData?.timestamp || null,
    refetch: () => query.refetch(),
  };
};

// Convert amount from any currency to EUR using live rates
export const convertToEURWithRates = (
  amount: number, 
  fromCurrency: string, 
  rates: Record<string, number>
): number => {
  if (fromCurrency === 'EUR') return amount;
  
  const rate = rates[fromCurrency];
  if (!rate) return amount; // Fallback if rate not found
  
  // rates are EUR -> other, so we need to divide
  return amount / rate;
};

// Convert from EUR to target currency
export const convertFromEURWithRates = (
  amount: number,
  toCurrency: string,
  rates: Record<string, number>
): number => {
  if (toCurrency === 'EUR') return amount;
  
  const rate = rates[toCurrency];
  if (!rate) return amount;
  
  return amount * rate;
};
