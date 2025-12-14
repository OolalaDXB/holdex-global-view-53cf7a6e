import { useMemo } from 'react';
import { Asset } from '@/hooks/useAssets';
import { Liability } from '@/hooks/useLiabilities';
import { Receivable } from '@/hooks/useReceivables';
import { Collection } from '@/hooks/useCollections';
import { Entity } from '@/hooks/useEntities';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { convertToEUR } from '@/lib/currency';
import { getUserOwnershipShare } from '@/lib/types';

export type CertaintyFilter = 'all' | 'confirmed' | 'exclude_optional';

interface CertaintySummary {
  certain: number;
  contractual: number;
  probable: number;
  optional: number;
}

interface BalanceSheetData {
  // Assets
  currentAssets: {
    cashAndBank: number;
    digitalAssets: number;
    shortTermReceivables: number;
    total: number;
  };
  nonCurrentAssets: {
    realEstate: number;
    vehicles: number;
    collections: number;
    investments: number;
    longTermReceivables: number;
    total: number;
  };
  totalAssets: number;
  
  // Liabilities
  currentLiabilities: {
    creditCards: number;
    shortTermLoans: number;
    total: number;
  };
  nonCurrentLiabilities: {
    mortgages: number;
    longTermLoans: number;
    total: number;
  };
  totalLiabilities: number;
  
  // Net Worth
  netWorth: number;
  
  // Drill-down data
  drillDown: {
    cashAndBank: Asset[];
    digitalAssets: Asset[];
    shortTermReceivables: Receivable[];
    realEstate: Asset[];
    vehicles: Collection[];
    collections: Collection[];
    investments: Asset[];
    longTermReceivables: Receivable[];
    creditCards: Liability[];
    shortTermLoans: Liability[];
    mortgages: Liability[];
    longTermLoans: Liability[];
  };

  // Certainty summary
  certaintySummary: {
    assets: CertaintySummary;
    liabilities: CertaintySummary;
  };
}

interface UseBalanceSheetOptions {
  assets: Asset[];
  collections: Collection[];
  liabilities: Liability[];
  receivables: Receivable[];
  entities: Entity[];
  baseCurrency: string;
  entityFilter: string | null; // null = consolidated
  certaintyFilter: CertaintyFilter;
  asOfDate?: Date;
  personalEntityId?: string | null;
}

interface CryptoPriceData {
  price: number;
  change24h: number;
}

export function useBalanceSheet({
  assets,
  collections,
  liabilities,
  receivables,
  entityFilter,
  certaintyFilter,
  personalEntityId,
}: UseBalanceSheetOptions): BalanceSheetData {
  const exchangeRatesQuery = useExchangeRates();
  const cryptoPricesQuery = useCryptoPrices();

  const rates = exchangeRatesQuery.data?.rates ?? {};
  const cryptoPrices: Record<string, CryptoPriceData> = cryptoPricesQuery.data ?? {};

  return useMemo(() => {
    // Filter by entity
    const filterByEntity = <T extends { entity_id?: string | null }>(items: T[]): T[] => {
      if (!entityFilter) return items;
      return items.filter(item => item.entity_id === entityFilter);
    };

    // Filter by certainty
    const filterByCertainty = <T extends { certainty?: string | null }>(items: T[], defaultCertainty: string): T[] => {
      return items.filter(item => {
        const certainty = item.certainty ?? defaultCertainty;
        if (certaintyFilter === 'all') return true;
        if (certaintyFilter === 'confirmed') return certainty === 'certain' || certainty === 'contractual';
        if (certaintyFilter === 'exclude_optional') return certainty !== 'optional';
        return true;
      });
    };

    // Convert value to base currency
    const toBaseCurrency = (value: number, currency: string, ticker?: string | null): number => {
      // Handle crypto
      if (ticker) {
        const cryptoPrice = cryptoPrices[ticker.toUpperCase()];
        if (cryptoPrice) {
          return convertToEUR(value * cryptoPrice.price, 'USD', rates);
        }
      }
      return convertToEUR(value, currency, rates);
    };

    // Filter assets
    const filteredAssets = filterByCertainty(filterByEntity(assets), 'certain');
    const filteredCollections = filterByCertainty(filterByEntity(collections), 'probable');
    const filteredLiabilities = filterByCertainty(filterByEntity(liabilities), 'certain');
    const filteredReceivables = filterByCertainty(filterByEntity(receivables), 'contractual');

    // Categorize assets
    const cashAndBankAssets = filteredAssets.filter(a => a.type === 'bank');
    const digitalAssets = filteredAssets.filter(a => a.type === 'crypto');
    const realEstateAssets = filteredAssets.filter(a => a.type === 'real-estate');
    const investmentAssets = filteredAssets.filter(a => a.type === 'investment' || a.type === 'business');

    // Categorize collections
    const vehicleCollections = filteredCollections.filter(c => c.type === 'vehicle');
    const otherCollections = filteredCollections.filter(c => c.type !== 'vehicle');

    // Categorize receivables (short-term = due within 1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    const shortTermReceivables = filteredReceivables.filter(r => {
      if (!r.due_date) return true; // No due date = short-term
      return new Date(r.due_date) <= oneYearFromNow;
    });
    const longTermReceivables = filteredReceivables.filter(r => {
      if (!r.due_date) return false;
      return new Date(r.due_date) > oneYearFromNow;
    });

    // Categorize liabilities
    const creditCards = filteredLiabilities.filter(l => l.type === 'credit_card');
    const shortTermLoans = filteredLiabilities.filter(l => {
      if (l.type === 'credit_card' || l.type === 'mortgage') return false;
      if (!l.end_date) return true;
      return new Date(l.end_date) <= oneYearFromNow;
    });
    const mortgages = filteredLiabilities.filter(l => l.type === 'mortgage');
    const longTermLoans = filteredLiabilities.filter(l => {
      if (l.type === 'credit_card' || l.type === 'mortgage') return false;
      if (!l.end_date) return false;
      return new Date(l.end_date) > oneYearFromNow;
    });

    // Calculate totals with parsed ownership allocation applied
    const sumAssets = (items: Asset[]): number => items.reduce((sum, a) => {
      const value = toBaseCurrency(a.current_value, a.currency, a.ticker);
      const share = getUserOwnershipShare(a.parsed_ownership_allocation, personalEntityId ?? null);
      return sum + (value * share);
    }, 0);

    const sumCollections = (items: Collection[]): number => items.reduce((sum, c) => {
      const value = toBaseCurrency(c.current_value, c.currency);
      const share = getUserOwnershipShare(c.parsed_ownership_allocation, personalEntityId ?? null);
      return sum + (value * share);
    }, 0);

    const sumLiabilities = (items: Liability[]): number => items.reduce((sum, l) => 
      sum + toBaseCurrency(l.current_balance, l.currency), 0);

    const sumReceivables = (items: Receivable[]): number => items.reduce((sum, r) => 
      sum + toBaseCurrency(r.current_balance, r.currency), 0);

    // Current Assets
    const cashAndBankTotal = sumAssets(cashAndBankAssets);
    const digitalAssetsTotal = sumAssets(digitalAssets);
    const shortTermReceivablesTotal = sumReceivables(shortTermReceivables);
    const currentAssetsTotal = cashAndBankTotal + digitalAssetsTotal + shortTermReceivablesTotal;

    // Non-Current Assets
    const realEstateTotal = sumAssets(realEstateAssets);
    const vehiclesTotal = sumCollections(vehicleCollections);
    const collectionsTotal = sumCollections(otherCollections);
    const investmentsTotal = sumAssets(investmentAssets);
    const longTermReceivablesTotal = sumReceivables(longTermReceivables);
    const nonCurrentAssetsTotal = realEstateTotal + vehiclesTotal + collectionsTotal + investmentsTotal + longTermReceivablesTotal;

    // Current Liabilities
    const creditCardsTotal = sumLiabilities(creditCards);
    const shortTermLoansTotal = sumLiabilities(shortTermLoans);
    const currentLiabilitiesTotal = creditCardsTotal + shortTermLoansTotal;

    // Non-Current Liabilities
    const mortgagesTotal = sumLiabilities(mortgages);
    const longTermLoansTotal = sumLiabilities(longTermLoans);
    const nonCurrentLiabilitiesTotal = mortgagesTotal + longTermLoansTotal;

    const totalAssets = currentAssetsTotal + nonCurrentAssetsTotal;
    const totalLiabilities = currentLiabilitiesTotal + nonCurrentLiabilitiesTotal;
    const netWorth = totalAssets - totalLiabilities;

    // Calculate certainty summary for all items (not filtered by certainty)
    const allAssetsFiltered = filterByEntity(assets);
    const allCollectionsFiltered = filterByEntity(collections);
    const allLiabilitiesFiltered = filterByEntity(liabilities);
    const allReceivablesFiltered = filterByEntity(receivables);

    const calcAssetCertaintySummary = (): CertaintySummary => {
      const summary: CertaintySummary = { certain: 0, contractual: 0, probable: 0, optional: 0 };
      
      allAssetsFiltered.forEach(a => {
        const cert = (a.certainty ?? 'certain') as keyof CertaintySummary;
        const value = toBaseCurrency(a.current_value, a.currency, a.ticker);
        const share = getUserOwnershipShare(a.parsed_ownership_allocation, personalEntityId ?? null);
        if (cert in summary) summary[cert] += value * share;
      });
      
      allCollectionsFiltered.forEach(c => {
        const cert = (c.certainty ?? 'probable') as keyof CertaintySummary;
        const value = toBaseCurrency(c.current_value, c.currency);
        const share = getUserOwnershipShare(c.parsed_ownership_allocation, personalEntityId ?? null);
        if (cert in summary) summary[cert] += value * share;
      });
      
      allReceivablesFiltered.forEach(r => {
        const cert = (r.certainty ?? 'contractual') as keyof CertaintySummary;
        const value = toBaseCurrency(r.current_balance, r.currency);
        if (cert in summary) summary[cert] += value;
      });
      
      return summary;
    };

    const calcLiabilityCertaintySummary = (): CertaintySummary => {
      const summary: CertaintySummary = { certain: 0, contractual: 0, probable: 0, optional: 0 };
      
      allLiabilitiesFiltered.forEach(l => {
        const cert = (l.certainty ?? 'certain') as keyof CertaintySummary;
        const value = toBaseCurrency(l.current_balance, l.currency);
        if (cert in summary) summary[cert] += value;
      });
      
      return summary;
    };

    return {
      currentAssets: {
        cashAndBank: cashAndBankTotal,
        digitalAssets: digitalAssetsTotal,
        shortTermReceivables: shortTermReceivablesTotal,
        total: currentAssetsTotal,
      },
      nonCurrentAssets: {
        realEstate: realEstateTotal,
        vehicles: vehiclesTotal,
        collections: collectionsTotal,
        investments: investmentsTotal,
        longTermReceivables: longTermReceivablesTotal,
        total: nonCurrentAssetsTotal,
      },
      totalAssets,
      currentLiabilities: {
        creditCards: creditCardsTotal,
        shortTermLoans: shortTermLoansTotal,
        total: currentLiabilitiesTotal,
      },
      nonCurrentLiabilities: {
        mortgages: mortgagesTotal,
        longTermLoans: longTermLoansTotal,
        total: nonCurrentLiabilitiesTotal,
      },
      totalLiabilities,
      netWorth,
      drillDown: {
        cashAndBank: cashAndBankAssets,
        digitalAssets,
        shortTermReceivables,
        realEstate: realEstateAssets,
        vehicles: vehicleCollections,
        collections: otherCollections,
        investments: investmentAssets,
        longTermReceivables,
        creditCards,
        shortTermLoans,
        mortgages,
        longTermLoans,
      },
      certaintySummary: {
        assets: calcAssetCertaintySummary(),
        liabilities: calcLiabilityCertaintySummary(),
      },
    };
  }, [assets, collections, liabilities, receivables, entityFilter, certaintyFilter, rates, cryptoPrices, personalEntityId]);
}
