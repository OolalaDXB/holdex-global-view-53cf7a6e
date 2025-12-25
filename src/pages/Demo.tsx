import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { NetWorthCard } from '@/components/dashboard/NetWorthCard';
import { NetWorthChart } from '@/components/dashboard/NetWorthChart';
import { CertaintyTrendChart } from '@/components/dashboard/CertaintyTrendChart';
import { BreakdownBar } from '@/components/dashboard/BreakdownBar';
import { CurrencyBreakdown } from '@/components/dashboard/CurrencyBreakdown';
import { DemoEntityBreakdown } from '@/components/dashboard/DemoEntityBreakdown';
import { CollapsibleSection, CollapsibleProvider, ExpandCollapseAllButton } from '@/components/dashboard/CollapsibleSection';
import { CertaintyBreakdownWidget } from '@/components/dashboard/CertaintyBreakdownWidget';
import { DemoDebtToIncomeWidget } from '@/components/dashboard/DemoDebtToIncomeWidget';
import { DemoNetWorthProjectionWidget } from '@/components/dashboard/DemoNetWorthProjectionWidget';
import { PropertyEquityWidget } from '@/components/dashboard/PropertyEquityWidget';
import { CollectionsGallery } from '@/components/dashboard/CollectionsGallery';
import { ViewToggle, ViewConfig } from '@/components/dashboard/ViewToggle';
import { AssetCard } from '@/components/assets/AssetCard';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDemo } from '@/contexts/DemoContext';
import { convertToEUR, convertFromEUR, fallbackRates } from '@/lib/currency';

// Demo crypto prices (static for demo purposes)
const demoCryptoPrices: Record<string, { price: number; change24h: number }> = {
  BTC: { price: 100000, change24h: 2.5 },
  ETH: { price: 3500, change24h: 1.2 },
  SOL: { price: 180, change24h: 3.1 },
  USDT: { price: 1, change24h: 0 },
  USDC: { price: 1, change24h: 0 },
  BNB: { price: 600, change24h: 0.8 },
  XRP: { price: 2.2, change24h: -0.5 },
  ADA: { price: 0.9, change24h: 1.5 },
  DOGE: { price: 0.35, change24h: 4.2 },
  MATIC: { price: 0.5, change24h: 2.1 },
};
import { Camera, Info } from 'lucide-react';
import { DemoDataBadge } from '@/components/ui/demo-data-badge';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getCountryFlag } from '@/hooks/useCountries';

const FINANCIAL_TYPES = ['real-estate', 'bank', 'investment', 'crypto', 'business'];

const currencySymbols: Record<string, string> = {
  EUR: '€',
  USD: '$',
  AED: 'AED',
  GBP: '£',
  CHF: 'Fr.',
  RUB: '₽',
};

// Helper to get user's ownership share from ownership_allocation
const getUserOwnershipShare = (
  ownershipAllocation: { entity_id: string; percentage: number }[] | null,
  personalEntityId: string | undefined
): number => {
  if (!ownershipAllocation || ownershipAllocation.length === 0) return 1;
  if (!personalEntityId) return 1;
  
  const personalShare = ownershipAllocation.find(a => a.entity_id === personalEntityId);
  return personalShare ? personalShare.percentage / 100 : 1;
};

const Demo = () => {
  const { toast } = useToast();
  const { assets, collections, liabilities, netWorthHistory, profile, entities } = useDemo();
  
  // Get personal entity ID for ownership calculations
  const personalEntityId = entities.find(e => e.type === 'personal')?.id;
  
  // Get currencies from demo profile
  const currencies = [profile.base_currency, profile.secondary_currency_1, profile.secondary_currency_2].filter(
    (c, i, arr) => arr.indexOf(c) === i
  );
  
  // Demo-specific state for currency and view
  const [displayCurrency, setDisplayCurrency] = useState<string>(profile.base_currency);
  const [viewConfig, setViewConfig] = useState<ViewConfig>({
    mode: 'all',
    customTypes: ['real-estate', 'bank', 'investment', 'crypto', 'business', 'collections'],
    includeFrozenBlocked: true,
  });

  // Use fallback rates for demo (realistic static rates)
  const rates = fallbackRates;
  const prices = demoCryptoPrices;

  // Get included types based on view config
  const getIncludedTypes = (): string[] => {
    switch (viewConfig.mode) {
      case 'all':
        return ['real-estate', 'bank', 'investment', 'crypto', 'business', 'collections'];
      case 'financial':
        return FINANCIAL_TYPES;
      case 'custom':
        return viewConfig.customTypes;
      default:
        return ['real-estate', 'bank', 'investment', 'crypto', 'business', 'collections'];
    }
  };

  const includedTypes = getIncludedTypes();
  const showCollections = includedTypes.includes('collections');

  // Helper to get asset value (with crypto prices)
  const getAssetValue = (asset: typeof assets[0]) => {
    if (asset.type === 'crypto' && asset.ticker && asset.quantity) {
      const cryptoPrice = prices[asset.ticker.toUpperCase()];
      if (cryptoPrice) {
        return cryptoPrice.price * asset.quantity;
      }
    }
    return asset.current_value;
  };

  // Filter assets based on view config and liquidity status
  const shouldIncludeAsset = (liquidityStatus: string | null | undefined): boolean => {
    if (viewConfig.includeFrozenBlocked) return true;
    const status = liquidityStatus || 'liquid';
    return status === 'liquid' || status === 'restricted';
  };

  const filteredAssets = assets.filter(asset => 
    includedTypes.includes(asset.type) && shouldIncludeAsset((asset as any).liquidity_status)
  );
  const filteredCollections = showCollections ? collections : [];

  // Calculate certainty breakdown by level - with ownership allocation
  const certaintyLevels = ['certain', 'contractual', 'probable', 'optional'] as const;
  
  const assetsBreakdownEUR = certaintyLevels.reduce((acc, level) => {
    acc[level] = filteredAssets
      .filter(a => ((a as any).certainty || 'certain') === level)
      .reduce((sum, asset) => {
        const eurValue = convertToEUR(getAssetValue(asset), asset.currency, rates);
        const ownershipShare = getUserOwnershipShare(
          (asset as any).ownership_allocation as { entity_id: string; percentage: number }[] | null,
          personalEntityId
        );
        return sum + (eurValue * ownershipShare);
      }, 0);
    // Add collections to 'certain' level (they don't have certainty field)
    if (level === 'certain') {
      acc[level] += filteredCollections.reduce((sum, item) => {
        const eurValue = convertToEUR(item.current_value, item.currency, rates);
        const ownershipShare = getUserOwnershipShare(
          (item as any).ownership_allocation as { entity_id: string; percentage: number }[] | null,
          personalEntityId
        );
        return sum + (eurValue * ownershipShare);
      }, 0);
    }
    return acc;
  }, {} as Record<typeof certaintyLevels[number], number>);

  const liabilitiesBreakdownEUR = certaintyLevels.reduce((acc, level) => {
    acc[level] = liabilities
      .filter(l => ((l as any).certainty || 'certain') === level)
      .reduce((sum, item) => sum + convertToEUR(item.current_balance, item.currency, rates), 0);
    return acc;
  }, {} as Record<typeof certaintyLevels[number], number>);

  // Calculate totals using rates (in EUR) - with ownership allocation
  const totalAssetsEUR = filteredAssets.reduce((sum, asset) => {
    const value = getAssetValue(asset);
    const eurValue = convertToEUR(value, asset.currency, rates);
    const ownershipShare = getUserOwnershipShare(
      (asset as any).ownership_allocation as { entity_id: string; percentage: number }[] | null,
      personalEntityId
    );
    return sum + (eurValue * ownershipShare);
  }, 0);

  const totalCollectionsEUR = filteredCollections.reduce((sum, item) => {
    const eurValue = convertToEUR(item.current_value, item.currency, rates);
    const ownershipShare = getUserOwnershipShare(
      (item as any).ownership_allocation as { entity_id: string; percentage: number }[] | null,
      personalEntityId
    );
    return sum + (eurValue * ownershipShare);
  }, 0);

  const totalLiabilitiesEUR = liabilities.reduce((sum, item) => {
    const eurValue = convertToEUR(item.current_balance, item.currency, rates);
    return sum + eurValue;
  }, 0);

  const netWorthEUR = totalAssetsEUR + totalCollectionsEUR - totalLiabilitiesEUR;

  // Confirmed = certain + contractual, Projected = probable + optional
  const confirmedNetWorthEUR = (assetsBreakdownEUR.certain + assetsBreakdownEUR.contractual) - 
                               (liabilitiesBreakdownEUR.certain + liabilitiesBreakdownEUR.contractual);
  const projectedNetWorthEUR = netWorthEUR - confirmedNetWorthEUR;
  
  // Convert to display currency
  const netWorth = convertFromEUR(netWorthEUR, displayCurrency, rates);
  const confirmedNetWorth = convertFromEUR(confirmedNetWorthEUR, displayCurrency, rates);
  const projectedNetWorth = convertFromEUR(projectedNetWorthEUR, displayCurrency, rates);

  // Convert breakdown to display currency for widget
  const assetsBreakdown = {
    certain: convertFromEUR(assetsBreakdownEUR.certain, displayCurrency, rates),
    contractual: convertFromEUR(assetsBreakdownEUR.contractual, displayCurrency, rates),
    probable: convertFromEUR(assetsBreakdownEUR.probable, displayCurrency, rates),
    optional: convertFromEUR(assetsBreakdownEUR.optional, displayCurrency, rates),
  };
  
  const liabilitiesBreakdown = {
    certain: convertFromEUR(liabilitiesBreakdownEUR.certain, displayCurrency, rates),
    contractual: convertFromEUR(liabilitiesBreakdownEUR.contractual, displayCurrency, rates),
    probable: convertFromEUR(liabilitiesBreakdownEUR.probable, displayCurrency, rates),
    optional: convertFromEUR(liabilitiesBreakdownEUR.optional, displayCurrency, rates),
  };

  // Calculate breakdowns - with ownership allocation
  const typeBreakdownEUR: Record<string, number> = { 
    'Real Estate': 0, 
    'Investments': 0, 
    'Business': 0, 
    'Collections': totalCollectionsEUR, 
    'Cash': 0 
  };

  filteredAssets.forEach(asset => {
    const value = getAssetValue(asset);
    const eurValue = convertToEUR(value, asset.currency, rates);
    const ownershipShare = getUserOwnershipShare(
      (asset as any).ownership_allocation as { entity_id: string; percentage: number }[] | null,
      personalEntityId
    );
    const adjustedValue = eurValue * ownershipShare;
    if (asset.type === 'real-estate') typeBreakdownEUR['Real Estate'] += adjustedValue;
    else if (asset.type === 'investment' || asset.type === 'crypto') typeBreakdownEUR['Investments'] += adjustedValue;
    else if (asset.type === 'business') typeBreakdownEUR['Business'] += adjustedValue;
    else if (asset.type === 'bank') typeBreakdownEUR['Cash'] += adjustedValue;
  });

  const totalGrossEUR = totalAssetsEUR + totalCollectionsEUR;

  const assetsByType = [
    { label: 'Real Estate', value: convertFromEUR(typeBreakdownEUR['Real Estate'], displayCurrency, rates), percentage: 0, included: includedTypes.includes('real-estate') },
    { label: 'Investments', value: convertFromEUR(typeBreakdownEUR['Investments'], displayCurrency, rates), percentage: 0, included: includedTypes.includes('investment') || includedTypes.includes('crypto') },
    { label: 'Business', value: convertFromEUR(typeBreakdownEUR['Business'], displayCurrency, rates), percentage: 0, included: includedTypes.includes('business') },
    { label: 'Collections', value: convertFromEUR(typeBreakdownEUR['Collections'], displayCurrency, rates), percentage: 0, included: showCollections },
    { label: 'Cash', value: convertFromEUR(typeBreakdownEUR['Cash'], displayCurrency, rates), percentage: 0, included: includedTypes.includes('bank') },
  ];

  assetsByType.forEach(item => {
    const eurValue = typeBreakdownEUR[item.label] || 0;
    item.percentage = totalGrossEUR > 0 ? (eurValue / totalGrossEUR) * 100 : 0;
  });

  // By country - with ownership allocation
  const countryMapEUR: Record<string, number> = {};
  filteredAssets.forEach(asset => {
    const value = getAssetValue(asset);
    const eurValue = convertToEUR(value, asset.currency, rates);
    const ownershipShare = getUserOwnershipShare(
      (asset as any).ownership_allocation as { entity_id: string; percentage: number }[] | null,
      personalEntityId
    );
    countryMapEUR[asset.country] = (countryMapEUR[asset.country] || 0) + (eurValue * ownershipShare);
  });
  filteredCollections.forEach(item => {
    const eurValue = convertToEUR(item.current_value, item.currency, rates);
    const ownershipShare = getUserOwnershipShare(
      (item as any).ownership_allocation as { entity_id: string; percentage: number }[] | null,
      personalEntityId
    );
    countryMapEUR[item.country] = (countryMapEUR[item.country] || 0) + (eurValue * ownershipShare);
  });

  const assetsByCountry = Object.entries(countryMapEUR)
    .map(([label, eurValue]) => ({
      label: `${getCountryFlag(label)} ${label}`,
      value: convertFromEUR(eurValue, displayCurrency, rates),
      percentage: totalGrossEUR > 0 ? (eurValue / totalGrossEUR) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // By currency - with ownership allocation - include collections
  const currencyMapEUR: Record<string, number> = {};
  filteredAssets.forEach(asset => {
    const value = getAssetValue(asset);
    const eurValue = convertToEUR(value, asset.currency, rates);
    const ownershipShare = getUserOwnershipShare(
      (asset as any).ownership_allocation as { entity_id: string; percentage: number }[] | null,
      personalEntityId
    );
    currencyMapEUR[asset.currency] = (currencyMapEUR[asset.currency] || 0) + (eurValue * ownershipShare);
  });
  // Add collections to currency breakdown
  filteredCollections.forEach(item => {
    const eurValue = convertToEUR(item.current_value, item.currency, rates);
    const ownershipShare = getUserOwnershipShare(
      (item as any).ownership_allocation as { entity_id: string; percentage: number }[] | null,
      personalEntityId
    );
    currencyMapEUR[item.currency] = (currencyMapEUR[item.currency] || 0) + (eurValue * ownershipShare);
  });

  const currencyBreakdown = Object.entries(currencyMapEUR)
    .map(([currency, eurValue]) => ({
      currency,
      percentage: totalGrossEUR > 0 ? (eurValue / totalGrossEUR) * 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Recent assets (last 5)
  const recentAssets = [...filteredAssets]
    .sort((a, b) => new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime())
    .slice(0, 5);

  // Property equity calculation - find assets with linked liabilities
  const propertyEquityData = useMemo(() => {
    const linkedLiabilities = liabilities.filter(l => l.linked_asset_id);
    
    return linkedLiabilities.map(liability => {
      const asset = assets.find(a => a.id === liability.linked_asset_id);
      if (!asset) return null;
      
      const assetValueEUR = convertToEUR(asset.current_value, asset.currency, rates);
      const liabilityBalanceEUR = convertToEUR(liability.current_balance, liability.currency, rates);
      const equityEUR = assetValueEUR - liabilityBalanceEUR;
      const equityPercentage = assetValueEUR > 0 ? (equityEUR / assetValueEUR) * 100 : 0;
      
      return {
        assetId: asset.id,
        assetName: asset.name,
        assetValue: convertFromEUR(assetValueEUR, displayCurrency, rates),
        liabilityId: liability.id,
        liabilityName: liability.name,
        liabilityBalance: convertFromEUR(liabilityBalanceEUR, displayCurrency, rates),
        equity: convertFromEUR(equityEUR, displayCurrency, rates),
        equityPercentage,
        currency: liability.currency,
        originalAmount: liability.original_amount ?? undefined,
        interestRate: liability.interest_rate ?? undefined,
        startDate: liability.start_date ?? undefined,
      };
    }).filter(Boolean) as {
      assetId: string;
      assetName: string;
      assetValue: number;
      liabilityId: string;
      liabilityName: string;
      liabilityBalance: number;
      equity: number;
      equityPercentage: number;
      currency: string;
      originalAmount?: number;
      interestRate?: number;
      startDate?: string;
    }[];
  }, [assets, liabilities, rates, displayCurrency]);

  // Chart data
  const chartData = netWorthHistory.map(item => ({
    month: new Date(item.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: convertFromEUR(item.net_worth_eur, displayCurrency, rates),
  }));

  // Calculate MTD change
  const previousValue = netWorthHistory.length > 1 
    ? netWorthHistory[netWorthHistory.length - 2]?.net_worth_eur 
    : netWorthEUR;
  const change = previousValue > 0 
    ? ((netWorthEUR - previousValue) / previousValue) * 100 
    : 0;

  const handleSaveSnapshot = () => {
    toast({
      title: "Demo Mode",
      description: "Snapshots are saved in the full version. Create an account to enable this feature.",
    });
  };

  return (
    <AppLayout isDemo>
      <div className="p-4 sm:p-6 lg:p-12 max-w-7xl">
        {/* Demo Banner */}
        <div className="mb-8 p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
          <Info size={20} className="text-primary mt-0.5 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-foreground">Demo Mode</span>
              <Badge variant="outline" className="text-xs">Lucas Soleil</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Explore all features with sample data. 
              <Link to="/auth" className="text-primary hover:underline ml-1">
                Create an account
              </Link> to manage your own wealth.
            </p>
          </div>
        </div>

        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <NetWorthCard 
              totalValue={netWorth} 
              grossAssets={convertFromEUR(totalGrossEUR, displayCurrency, rates)}
              totalLiabilities={convertFromEUR(totalLiabilitiesEUR, displayCurrency, rates)}
              change={change} 
              currency={displayCurrency} 
            />
            <div className="flex items-center gap-2">
              <ViewToggle config={viewConfig} onChange={setViewConfig} />
              
              {/* Demo Currency Switcher */}
              <div className="flex items-center rounded-md bg-secondary/50 p-1">
                {currencies.map((currency) => (
                  <button
                    key={currency}
                    onClick={() => setDisplayCurrency(currency)}
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded transition-colors",
                      displayCurrency === currency
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {currencySymbols[currency] || currency}
                  </button>
                ))}
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSaveSnapshot}
                    className="gap-2"
                  >
                    <Camera size={14} />
                    Snapshot
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save your current portfolio value for accurate historical tracking</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <DemoDataBadge label="FX: Demo rates" />
            <DemoDataBadge label="Crypto: Demo prices" />
          </div>
        </header>

        {/* Chart */}
        <section className="mb-12">
          {chartData.length > 0 ? (
            <NetWorthChart data={chartData} />
          ) : (
            <div className="p-8 rounded-lg border border-border bg-secondary/20 text-center">
              <Info size={24} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No historical data yet</p>
              <p className="text-sm text-muted-foreground">
                Save your first snapshot to start tracking your wealth over time.
              </p>
            </div>
          )}
        </section>

        {/* Collapsible Breakdowns */}
        <CollapsibleProvider>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-serif text-sm font-medium text-muted-foreground uppercase tracking-wide">Breakdowns</h3>
            <ExpandCollapseAllButton />
          </div>
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <CollapsibleSection id="demo_breakdown_type" title="By Asset Type">
              <BreakdownBar 
                items={assetsByType.filter(i => i.percentage > 0 && i.included)} 
                delay={0}
              />
            </CollapsibleSection>
            
            <CollapsibleSection id="demo_breakdown_country" title="By Country">
              <BreakdownBar 
                items={assetsByCountry} 
                delay={0}
              />
            </CollapsibleSection>
            
            {currencyBreakdown.length > 0 && (
              <CollapsibleSection id="demo_breakdown_currency" title="By Currency">
                <CurrencyBreakdown items={currencyBreakdown} delay={0} />
              </CollapsibleSection>
            )}

            <CollapsibleSection id="demo_breakdown_entity" title="By Entity">
              <DemoEntityBreakdown displayCurrency={displayCurrency} delay={0} />
            </CollapsibleSection>
          </section>
        </CollapsibleProvider>

        {/* Optional widgets shown in demo to showcase features */}
        
        {/* Property Equity Widget */}
        {propertyEquityData.length > 0 && (
          <section className="mb-8 animate-fade-in" style={{ animationDelay: '145ms' }}>
            <PropertyEquityWidget 
              properties={propertyEquityData}
              displayCurrency={displayCurrency}
            />
          </section>
        )}

        <CertaintyBreakdownWidget
          assetsBreakdown={assetsBreakdown}
          liabilitiesBreakdown={liabilitiesBreakdown}
          currency={displayCurrency}
          delay={150}
        />

        {/* Certainty Trend Chart */}
        {netWorthHistory.length > 0 && (
          <section className="mb-8 animate-fade-in" style={{ animationDelay: '155ms' }}>
            <h3 className="font-serif text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Certainty Trend
            </h3>
            <div className="asset-card">
              <CertaintyTrendChart 
                data={netWorthHistory.map(h => ({
                  snapshot_date: h.snapshot_date,
                  certainty_breakdown_assets: h.certainty_breakdown_assets,
                  certainty_breakdown_liabilities: h.certainty_breakdown_liabilities,
                  net_worth_eur: h.net_worth_eur,
                }))}
                displayCurrency={displayCurrency}
                convertFromEUR={(value, currency) => convertFromEUR(value, currency, fallbackRates)}
              />
            </div>
          </section>
        )}

        <DemoDebtToIncomeWidget delay={175} />

        <DemoNetWorthProjectionWidget delay={180} />

        {/* Collections Gallery - only show if collections are included */}
        {showCollections && <CollectionsGallery collections={collections as any} />}

        {/* Recent Updates */}
        {recentAssets.length > 0 && (
          <section>
            <h3 className="font-serif text-lg font-medium text-foreground mb-6">Recent Updates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {recentAssets.map((asset, index) => (
                <AssetCard 
                  key={asset.id} 
                  asset={asset as any} 
                  rates={rates}
                  cryptoPrices={prices}
                  displayCurrency={displayCurrency}
                  delay={500 + (index * 100)} 
                  entities={entities as any}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Demo;