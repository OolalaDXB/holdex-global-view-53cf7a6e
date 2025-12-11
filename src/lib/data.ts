// Sample data for HOLDEX MVP

export interface Asset {
  id: string;
  type: 'real-estate' | 'bank' | 'investment' | 'crypto' | 'business' | 'liability';
  name: string;
  country: string;
  currency: string;
  currentValue: number;
  purchasePrice?: number;
  ownershipPercent?: number;
  rentalIncome?: number;
  cryptoToken?: string;
  cryptoQuantity?: number;
  change24h?: number;
  linkedAssetId?: string;
  platform?: string;
}

export interface Collection {
  id: string;
  category: 'watch' | 'vehicle' | 'art' | 'jewelry' | 'wine' | 'lp-position' | 'other';
  name: string;
  country: string;
  currency: string;
  purchasePrice: number;
  purchaseDate?: string;
  currentValue: number;
  photoUrl?: string;
  notes?: string;
}

export interface NetWorthHistory {
  month: string;
  value: number;
}

export const assets: Asset[] = [
  {
    id: '1',
    type: 'real-estate',
    name: 'Dubai Marina Apartment',
    country: 'UAE',
    currency: 'AED',
    currentValue: 3200000,
    purchasePrice: 2800000,
    rentalIncome: 180000,
  },
  {
    id: '2',
    type: 'real-estate',
    name: 'Cascais Villa',
    country: 'Portugal',
    currency: 'EUR',
    currentValue: 850000,
    purchasePrice: 720000,
  },
  {
    id: '3',
    type: 'bank',
    name: 'Emirates NBD Current',
    country: 'UAE',
    currency: 'AED',
    currentValue: 450000,
  },
  {
    id: '4',
    type: 'investment',
    name: 'Interactive Brokers Portfolio',
    country: 'USA',
    currency: 'USD',
    currentValue: 320000,
    platform: 'Interactive Brokers',
  },
  {
    id: '5',
    type: 'crypto',
    name: 'Bitcoin Holdings',
    country: 'Global',
    currency: 'USD',
    currentValue: 265000,
    cryptoToken: 'BTC',
    cryptoQuantity: 2.5,
    change24h: 2.3,
    platform: 'Ledger',
  },
  {
    id: '6',
    type: 'crypto',
    name: 'Ethereum',
    country: 'Global',
    currency: 'USD',
    currentValue: 58000,
    cryptoToken: 'ETH',
    cryptoQuantity: 15,
    change24h: -1.2,
    platform: 'Ledger',
  },
  {
    id: '7',
    type: 'business',
    name: 'Oolala FZ LLC',
    country: 'UAE',
    currency: 'USD',
    currentValue: 150000,
    ownershipPercent: 100,
  },
  {
    id: '8',
    type: 'business',
    name: 'District 267',
    country: 'Botswana',
    currency: 'USD',
    currentValue: 300000,
    ownershipPercent: 25,
  },
  {
    id: '9',
    type: 'liability',
    name: 'Dubai Apartment Mortgage',
    country: 'UAE',
    currency: 'AED',
    currentValue: -1800000,
    linkedAssetId: '1',
  },
];

export const collections: Collection[] = [
  {
    id: '1',
    category: 'watch',
    name: 'Rolex Daytona 116500LN',
    country: 'Switzerland',
    currency: 'CHF',
    purchasePrice: 13500,
    purchaseDate: '2019-06-15',
    currentValue: 42000,
  },
  {
    id: '2',
    category: 'vehicle',
    name: 'Porsche 911 (992) Carrera S',
    country: 'Germany',
    currency: 'EUR',
    purchasePrice: 142000,
    purchaseDate: '2022-03-20',
    currentValue: 135000,
  },
  {
    id: '3',
    category: 'wine',
    name: 'Bordeaux Collection',
    country: 'France',
    currency: 'EUR',
    purchasePrice: 18000,
    purchaseDate: '2018-09-01',
    currentValue: 28000,
    notes: 'Château Margaux, Pétrus, Lafite Rothschild vintages',
  },
  {
    id: '4',
    category: 'lp-position',
    name: 'Sequoia Scout Fund LP',
    country: 'USA',
    currency: 'USD',
    purchasePrice: 50000,
    purchaseDate: '2021-01-15',
    currentValue: 50000,
    notes: 'Capital call completed, awaiting distributions',
  },
];

export const netWorthHistory: NetWorthHistory[] = [
  { month: 'Jan', value: 2450000 },
  { month: 'Feb', value: 2520000 },
  { month: 'Mar', value: 2580000 },
  { month: 'Apr', value: 2510000 },
  { month: 'May', value: 2620000 },
  { month: 'Jun', value: 2680000 },
  { month: 'Jul', value: 2720000 },
  { month: 'Aug', value: 2690000 },
  { month: 'Sep', value: 2780000 },
  { month: 'Oct', value: 2810000 },
  { month: 'Nov', value: 2790000 },
  { month: 'Dec', value: 2847000 },
];

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

export const getAssetTypeIcon = (type: Asset['type']): string => {
  const icons: Record<Asset['type'], string> = {
    'real-estate': '🏠',
    'bank': '🏦',
    'investment': '📈',
    'crypto': '₿',
    'business': '🏢',
    'liability': '📉',
  };
  return icons[type];
};

export const getCollectionIcon = (category: Collection['category']): string => {
  const icons: Record<Collection['category'], string> = {
    'watch': '⌚',
    'vehicle': '🚗',
    'art': '🎨',
    'jewelry': '💎',
    'wine': '🍷',
    'lp-position': '📊',
    'other': '✨',
  };
  return icons[category];
};
