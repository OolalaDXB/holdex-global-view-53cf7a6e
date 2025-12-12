import { AppLayout } from '@/components/layout/AppLayout';
import { NetWorthCard } from '@/components/dashboard/NetWorthCard';
import { NetWorthChart } from '@/components/dashboard/NetWorthChart';
import { BreakdownBar } from '@/components/dashboard/BreakdownBar';
import { CurrencyBreakdown } from '@/components/dashboard/CurrencyBreakdown';
import { CurrencySwitcher } from '@/components/dashboard/CurrencySwitcher';
import { ViewToggle, useViewConfig } from '@/components/dashboard/ViewToggle';
import { CollectionsGallery } from '@/components/dashboard/CollectionsGallery';
import { ExpiringDocumentsWidget } from '@/components/dashboard/ExpiringDocumentsWidget';
import { LeaseholdRemindersWidget } from '@/components/dashboard/LeaseholdRemindersWidget';
import { WorldClocksWidget } from '@/components/dashboard/WorldClocksWidget';
import { BlurToggle } from '@/components/dashboard/BlurToggle';
import { PendingReceivablesWidget } from '@/components/dashboard/PendingReceivablesWidget';
import { EntityBreakdown } from '@/components/dashboard/EntityBreakdown';
import { AssetCard } from '@/components/assets/AssetCard';
import { Button } from '@/components/ui/button';
import { useAssets } from '@/hooks/useAssets';
import { useCollections } from '@/hooks/useCollections';
import { useLiabilities } from '@/hooks/useLiabilities';
import { useNetWorthHistory } from '@/hooks/useNetWorthHistory';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useCryptoPrices, fallbackCryptoPrices } from '@/hooks/useCryptoPrices';
import { useSaveSnapshot } from '@/hooks/useNetWorthSnapshot';
import { useProfile } from '@/hooks/useProfile';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useBlur } from '@/contexts/BlurContext';
import { convertToEUR, convertFromEUR, fallbackRates, formatCurrency } from '@/lib/currency';
import { RefreshCw, Camera, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getCountryFlag } from '@/hooks/useCountries';

interface City {
  name: string;
  timezone: string;
}

const Dashboard = () => {
  const { toast } = useToast();
  const { data: profile } = useProfile();
  const { data: assets = [], isLoading: assetsLoading } = useAssets();
  const { data: collections = [], isLoading: collectionsLoading } = useCollections();
  const { data: liabilities = [], isLoading: liabilitiesLoading } = useLiabilities();
  const { data: netWorthHistoryData = [] } = useNetWorthHistory();
  const { data: exchangeRates, isLoading: ratesLoading, dataUpdatedAt: fxUpdatedAt } = useExchangeRates();
  const { data: cryptoPrices, dataUpdatedAt: cryptoUpdatedAt } = useCryptoPrices();
  const saveSnapshot = useSaveSnapshot();
  const { displayCurrency, convertToDisplay, formatInDisplayCurrency } = useCurrency();
  const { config: viewConfig, setConfig: setViewConfig, getIncludedTypes, includesCollections, shouldIncludeAsset } = useViewConfig();
  const { isBlurred, formatBlurred } = useBlur();

  // Get user preferences
  const favoriteCities: City[] = (profile as any)?.favorite_cities || [];
  const dashboardWidgets: string[] = (profile as any)?.dashboard_widgets || [
    'net_worth', 'chart', 'breakdown_type', 'breakdown_country', 'breakdown_currency',
    'leasehold_reminders', 'expiring_documents'
  ];

  const isLoading = assetsLoading || collectionsLoading || liabilitiesLoading;
  const rates = exchangeRates?.rates || fallbackRates;
  const prices = cryptoPrices || fallbackCryptoPrices;
  
  // Get included types based on view config
  const includedTypes = getIncludedTypes();
  const showCollections = includesCollections();

  // Helper to get asset value (with live crypto prices)
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
  const filteredAssets = assets.filter(asset => 
    includedTypes.includes(asset.type) && shouldIncludeAsset(asset.liquidity_status)
  );
  const filteredCollections = showCollections ? collections : [];

  // Calculate totals using live rates and crypto prices (in EUR for storage)
  const totalAssetsEUR = filteredAssets.reduce((sum, asset) => {
    const value = getAssetValue(asset);
    const eurValue = convertToEUR(value, asset.currency, rates);
    return sum + eurValue;
  }, 0);

  const totalCollectionsEUR = filteredCollections.reduce((sum, item) => {
    const eurValue = convertToEUR(item.current_value, item.currency, rates);
    return sum + eurValue;
  }, 0);

  const totalLiabilitiesEUR = liabilities.reduce((sum, item) => {
    const eurValue = convertToEUR(item.current_balance, item.currency, rates);
    return sum + eurValue;
  }, 0);

  const netWorthEUR = totalAssetsEUR + totalCollectionsEUR - totalLiabilitiesEUR;
  
  // Convert to display currency
  const netWorth = convertFromEUR(netWorthEUR, displayCurrency, rates);

  // Calculate breakdowns (in display currency)
  const assetsByType = [
    { label: 'Real Estate', value: 0, percentage: 0, included: includedTypes.includes('real-estate') },
    { label: 'Investments', value: 0, percentage: 0, included: includedTypes.includes('investment') || includedTypes.includes('crypto') },
    { label: 'Business', value: 0, percentage: 0, included: includedTypes.includes('business') },
    { label: 'Collections', value: convertFromEUR(totalCollectionsEUR, displayCurrency, rates), percentage: 0, included: showCollections },
    { label: 'Cash', value: 0, percentage: 0, included: includedTypes.includes('bank') },
  ];

  // Breakdown by type (in EUR for percentage calc)
  const typeBreakdownEUR: Record<string, number> = { 'Real Estate': 0, 'Investments': 0, 'Business': 0, 'Collections': totalCollectionsEUR, 'Cash': 0 };
  
  filteredAssets.forEach(asset => {
    const value = getAssetValue(asset);
    const eurValue = convertToEUR(value, asset.currency, rates);
    if (asset.type === 'real-estate') typeBreakdownEUR['Real Estate'] += eurValue;
    else if (asset.type === 'investment' || asset.type === 'crypto') typeBreakdownEUR['Investments'] += eurValue;
    else if (asset.type === 'business') typeBreakdownEUR['Business'] += eurValue;
    else if (asset.type === 'bank') typeBreakdownEUR['Cash'] += eurValue;
  });

  const totalGrossEUR = totalAssetsEUR + totalCollectionsEUR;
  
  assetsByType[0].value = convertFromEUR(typeBreakdownEUR['Real Estate'], displayCurrency, rates);
  assetsByType[1].value = convertFromEUR(typeBreakdownEUR['Investments'], displayCurrency, rates);
  assetsByType[2].value = convertFromEUR(typeBreakdownEUR['Business'], displayCurrency, rates);
  assetsByType[4].value = convertFromEUR(typeBreakdownEUR['Cash'], displayCurrency, rates);
  
  assetsByType.forEach(item => {
    const eurValue = typeBreakdownEUR[item.label] || 0;
    item.percentage = totalGrossEUR > 0 ? (eurValue / totalGrossEUR) * 100 : 0;
  });

  // By country (filtered)
  const countryMapEUR: Record<string, number> = {};
  filteredAssets.forEach(asset => {
    const value = getAssetValue(asset);
    const eurValue = convertToEUR(value, asset.currency, rates);
    countryMapEUR[asset.country] = (countryMapEUR[asset.country] || 0) + eurValue;
  });
  filteredCollections.forEach(item => {
    const eurValue = convertToEUR(item.current_value, item.currency, rates);
    countryMapEUR[item.country] = (countryMapEUR[item.country] || 0) + eurValue;
  });

  const assetsByCountry = Object.entries(countryMapEUR)
    .map(([label, eurValue]) => ({
      label: `${getCountryFlag(label)} ${label}`,
      value: convertFromEUR(eurValue, displayCurrency, rates),
      percentage: totalGrossEUR > 0 ? (eurValue / totalGrossEUR) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // By currency (filtered)
  const currencyMapEUR: Record<string, number> = {};
  filteredAssets.forEach(asset => {
    const value = getAssetValue(asset);
    const eurValue = convertToEUR(value, asset.currency, rates);
    currencyMapEUR[asset.currency] = (currencyMapEUR[asset.currency] || 0) + eurValue;
  });

  const currencyBreakdown = Object.entries(currencyMapEUR)
    .map(([currency, eurValue]) => ({
      currency,
      percentage: totalGrossEUR > 0 ? (eurValue / totalGrossEUR) * 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Recent assets (last 5 from filtered)
  const recentAssets = filteredAssets.slice(0, 5);

  // Chart data - use ONLY snapshot data
  const chartData = netWorthHistoryData.length > 0 
    ? netWorthHistoryData.map(item => ({
        month: new Date(item.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: convertFromEUR(item.net_worth_eur, displayCurrency, rates),
      }))
    : [];

  // Calculate MTD change
  const previousValue = netWorthHistoryData.length > 1 
    ? netWorthHistoryData[netWorthHistoryData.length - 2]?.net_worth_eur 
    : netWorthEUR;
  const change = previousValue > 0 
    ? ((netWorthEUR - previousValue) / previousValue) * 100 
    : 0;

  // Format last updated times
  const fxLastUpdated = fxUpdatedAt 
    ? new Date(fxUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;
  const cryptoLastUpdated = cryptoUpdatedAt
    ? new Date(cryptoUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  const handleSaveSnapshot = async () => {
    try {
      await saveSnapshot.mutateAsync({
        total_assets_eur: totalAssetsEUR,
        total_collections_eur: totalCollectionsEUR,
        total_liabilities_eur: totalLiabilitiesEUR,
        net_worth_eur: netWorthEUR,
        breakdown_by_type: typeBreakdownEUR,
        breakdown_by_country: countryMapEUR,
        breakdown_by_currency: currencyMapEUR,
        exchange_rates_snapshot: rates,
        crypto_prices_snapshot: prices,
      });
      toast({
        title: "Snapshot saved",
        description: "Your portfolio value has been recorded for historical tracking.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save snapshot. Please try again.",
      });
    }
  };

  // Helper functions to check widget visibility
  const showWidget = (widgetId: string) => dashboardWidgets.includes(widgetId);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 lg:p-12 max-w-7xl flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading your wealth data...</div>
        </div>
      </AppLayout>
    );
  }

  const hasData = assets.length > 0 || collections.length > 0;
  const hasCrypto = assets.some(a => a.type === 'crypto');

  // Format value with blur support
  const formatValue = (value: number, currency: string) => {
    if (isBlurred) return '•••••';
    return formatCurrency(value, currency);
  };

  return (
    <AppLayout>
      <div className="p-8 lg:p-12 max-w-7xl">
        {/* World Clocks Widget */}
        {showWidget('world_clocks') && favoriteCities.length > 0 && (
          <WorldClocksWidget cities={favoriteCities} />
        )}

        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            {showWidget('net_worth') && (
              <NetWorthCard 
                totalValue={netWorth} 
                change={change} 
                currency={displayCurrency}
                isBlurred={isBlurred}
              />
            )}
            <div className="flex items-center gap-2">
              <BlurToggle />
              <ViewToggle config={viewConfig} onChange={setViewConfig} />
              <CurrencySwitcher />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSaveSnapshot}
                    disabled={saveSnapshot.isPending}
                    className="gap-2"
                  >
                    <Camera size={14} />
                    {saveSnapshot.isPending ? 'Saving...' : 'Snapshot'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save your current portfolio value for accurate historical tracking</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
            {fxLastUpdated && (
              <div className="flex items-center gap-1">
                <RefreshCw size={12} className={ratesLoading ? 'animate-spin' : ''} />
                <span>FX: {fxLastUpdated}</span>
              </div>
            )}
            {hasCrypto && cryptoLastUpdated && (
              <div className="flex items-center gap-1">
                <RefreshCw size={12} />
                <span>Crypto: {cryptoLastUpdated}</span>
              </div>
            )}
          </div>
        </header>

        {hasData ? (
          <>
            {/* Chart */}
            {showWidget('chart') && (
              <section className="mb-12">
                {chartData.length > 0 ? (
                  <NetWorthChart data={chartData} isBlurred={isBlurred} />
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
            )}

            {/* Breakdowns */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
              {showWidget('breakdown_type') && (
                <BreakdownBar 
                  title="By Asset Type" 
                  items={assetsByType.filter(i => i.percentage > 0 && i.included)} 
                  delay={200}
                  isBlurred={isBlurred}
                />
              )}
              {showWidget('breakdown_country') && (
                <BreakdownBar 
                  title="By Country" 
                  items={assetsByCountry} 
                  delay={300}
                  isBlurred={isBlurred}
                />
              )}
            </section>

            {/* Currency */}
            {showWidget('breakdown_currency') && currencyBreakdown.length > 0 && (
              <section className="mb-12">
                <CurrencyBreakdown items={currencyBreakdown} delay={400} isBlurred={isBlurred} />
              </section>
            )}

            {/* Entity Breakdown */}
            {showWidget('breakdown_entity') && (
              <section className="mb-12 pb-12 border-b border-border">
                <EntityBreakdown delay={500} isBlurred={isBlurred} />
              </section>
            )}

            {/* Expiring Documents Widget */}
            {showWidget('expiring_documents') && <ExpiringDocumentsWidget />}

            {/* Leasehold Reminders Widget */}
            {showWidget('leasehold_reminders') && <LeaseholdRemindersWidget assets={assets} />}

            {/* Pending Receivables Widget */}
            {showWidget('pending_receivables') && <PendingReceivablesWidget isBlurred={isBlurred} />}

            {/* Collections Gallery - only show if collections are included */}
            {showCollections && <CollectionsGallery collections={collections} isBlurred={isBlurred} />}

            {/* Recent Updates */}
            {recentAssets.length > 0 && (
              <section>
                <h3 className="font-serif text-lg font-medium text-foreground mb-6">Recent Updates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {recentAssets.map((asset, index) => (
                    <AssetCard 
                      key={asset.id} 
                      asset={asset} 
                      rates={rates}
                      cryptoPrices={prices}
                      displayCurrency={displayCurrency}
                      delay={500 + (index * 100)}
                      isBlurred={isBlurred}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <section className="text-center py-16">
            <p className="text-muted-foreground mb-4">No assets yet. Start building your wealth portfolio.</p>
            <a 
              href="/add" 
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Add Your First Asset
            </a>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
