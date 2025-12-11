// Exchange rates (EUR as base)
export const exchangeRates: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  AED: 3.97,
  GBP: 0.86,
  CHF: 0.94,
  RUB: 98.5,
};

export const convertToEUR = (amount: number, currency: string): number => {
  const rate = exchangeRates[currency] || 1;
  return amount / rate;
};

export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    AED: 'AED ',
    GBP: '£',
    CHF: 'CHF ',
    RUB: '₽',
  };
  
  const symbol = symbols[currency] || currency + ' ';
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
};

export const getAssetTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'real-estate': '🏠',
    'bank': '🏦',
    'investment': '📈',
    'crypto': '₿',
    'business': '🏢',
    'liability': '📉',
  };
  return icons[type] || '📊';
};

export const getCollectionIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'watch': '⌚',
    'vehicle': '🚗',
    'art': '🎨',
    'jewelry': '💎',
    'wine': '🍷',
    'lp-position': '📊',
    'other': '✨',
  };
  return icons[category] || '✨';
};
