import { useQuery } from '@tanstack/react-query';

const API_KEY = '99f084bbea744d9c1125f5cd';
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest`;

interface ExchangeRateResponse {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
  time_last_update_utc: string;
}

export interface ExchangeRates {
  rates: Record<string, number>;
  baseCurrency: string;
  lastUpdated: string;
}

// Fetch rates with EUR as base (for consistency with app)
export const useExchangeRates = () => {
  return useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async (): Promise<ExchangeRates> => {
      const response = await fetch(`${BASE_URL}/EUR`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      
      const data: ExchangeRateResponse = await response.json();
      
      if (data.result !== 'success') {
        throw new Error('Exchange rate API returned an error');
      }
      
      return {
        rates: data.conversion_rates,
        baseCurrency: data.base_code,
        lastUpdated: data.time_last_update_utc,
      };
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    refetchOnWindowFocus: false,
  });
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
