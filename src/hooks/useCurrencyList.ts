import { useMemo } from 'react';
import { useExchangeRates } from './useExchangeRates';
import { useProfile } from './useProfile';

/**
 * Returns the full list of ISO currencies from the exchange rates API,
 * with user's preferred currencies (base + secondary 1 & 2) at the top.
 */
export function useCurrencyList() {
  const { data: exchangeRates } = useExchangeRates();
  const { data: profile } = useProfile();

  const currencies = useMemo(() => {
    // Get all currencies from API or fallback
    const allCurrencies = exchangeRates?.rates 
      ? Object.keys(exchangeRates.rates).sort()
      : ['EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB'];

    // Get user's preferred currencies
    const baseCurrency = profile?.base_currency || 'EUR';
    const secondary1 = profile?.secondary_currency_1 || 'USD';
    const secondary2 = profile?.secondary_currency_2 || 'AED';

    // Create unique preferred list (in order of priority)
    const preferred = [baseCurrency, secondary1, secondary2].filter(
      (c, i, arr) => arr.indexOf(c) === i && allCurrencies.includes(c)
    );

    // Filter out preferred from the main list and combine
    const rest = allCurrencies.filter(c => !preferred.includes(c));

    return [...preferred, ...rest];
  }, [exchangeRates?.rates, profile?.base_currency, profile?.secondary_currency_1, profile?.secondary_currency_2]);

  return currencies;
}

/**
 * Demo version that uses provided profile data instead of fetching
 */
export function useDemoCurrencyList(profile: { 
  base_currency?: string; 
  secondary_currency_1?: string; 
  secondary_currency_2?: string;
} | null) {
  const { data: exchangeRates } = useExchangeRates();

  const currencies = useMemo(() => {
    // Get all currencies from API or fallback
    const allCurrencies = exchangeRates?.rates 
      ? Object.keys(exchangeRates.rates).sort()
      : ['EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB'];

    // Get user's preferred currencies from demo profile
    const baseCurrency = profile?.base_currency || 'EUR';
    const secondary1 = profile?.secondary_currency_1 || 'USD';
    const secondary2 = profile?.secondary_currency_2 || 'AED';

    // Create unique preferred list (in order of priority)
    const preferred = [baseCurrency, secondary1, secondary2].filter(
      (c, i, arr) => arr.indexOf(c) === i && allCurrencies.includes(c)
    );

    // Filter out preferred from the main list and combine
    const rest = allCurrencies.filter(c => !preferred.includes(c));

    return [...preferred, ...rest];
  }, [exchangeRates?.rates, profile?.base_currency, profile?.secondary_currency_1, profile?.secondary_currency_2]);

  return currencies;
}
