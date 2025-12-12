import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { convertFromEUR, convertToEUR, fallbackRates } from '@/lib/currency';

interface CurrencyContextType {
  displayCurrency: string;
  setDisplayCurrency: (currency: string) => void;
  baseCurrency: string;
  secondaryCurrency1: string;
  secondaryCurrency2: string;
  availableCurrencies: string[];
  rates: Record<string, number>;
  convertToDisplay: (amount: number, fromCurrency: string) => number;
  formatInDisplayCurrency: (amount: number, fromCurrency: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const DISPLAY_CURRENCY_KEY = 'holdex-display-currency';

// Currency symbols mapping
const currencySymbols: Record<string, string> = {
  EUR: '€',
  USD: '$',
  AED: 'د.إ',
  GBP: '£',
  CHF: 'CHF',
  RUB: '₽',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  INR: '₹',
  BRL: 'R$',
  CAD: 'C$',
  AUD: 'A$',
  SGD: 'S$',
  HKD: 'HK$',
  MXN: 'MX$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  TRY: '₺',
  THB: '฿',
  ZAR: 'R',
  GEL: '₾',
};

// Currencies with 0 decimal places
const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR'];

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { data: profile } = useProfile();
  const { data: exchangeRates } = useExchangeRates();
  
  const baseCurrency = profile?.base_currency || 'EUR';
  const secondaryCurrency1 = profile?.secondary_currency_1 || 'USD';
  const secondaryCurrency2 = profile?.secondary_currency_2 || 'AED';
  const rates = exchangeRates?.rates || fallbackRates;
  
  const [displayCurrency, setDisplayCurrencyState] = useState(() => {
    const saved = localStorage.getItem(DISPLAY_CURRENCY_KEY);
    return saved || baseCurrency;
  });

  // Update display currency when base currency changes
  useEffect(() => {
    const saved = localStorage.getItem(DISPLAY_CURRENCY_KEY);
    if (!saved) {
      setDisplayCurrencyState(baseCurrency);
    }
  }, [baseCurrency]);

  const setDisplayCurrency = (currency: string) => {
    setDisplayCurrencyState(currency);
    localStorage.setItem(DISPLAY_CURRENCY_KEY, currency);
  };

  // Get all available currencies from API
  const availableCurrencies = Object.keys(rates).sort();

  // Convert amount from any currency to the display currency
  const convertToDisplay = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === displayCurrency) return amount;
    
    // First convert to EUR (base), then to display currency
    const eurValue = convertToEUR(amount, fromCurrency, rates);
    return convertFromEUR(eurValue, displayCurrency, rates);
  };

  // Format amount in display currency
  const formatInDisplayCurrency = (amount: number, fromCurrency: string): string => {
    const converted = convertToDisplay(amount, fromCurrency);
    const symbol = currencySymbols[displayCurrency] || `${displayCurrency} `;
    const decimals = zeroDecimalCurrencies.includes(displayCurrency) ? 0 : 0;
    
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Math.abs(converted));
    
    return converted < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        displayCurrency,
        setDisplayCurrency,
        baseCurrency,
        secondaryCurrency1,
        secondaryCurrency2,
        availableCurrencies,
        rates,
        convertToDisplay,
        formatInDisplayCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
