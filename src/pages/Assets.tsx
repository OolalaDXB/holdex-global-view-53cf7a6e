import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AssetCard } from '@/components/assets/AssetCard';
import { useAssets } from '@/hooks/useAssets';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { fallbackRates } from '@/lib/currency';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'real-estate' | 'bank' | 'investment' | 'crypto' | 'business';

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All Assets' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'bank', label: 'Bank Accounts' },
  { value: 'investment', label: 'Investments' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'business', label: 'Business' },
];

const AssetsPage = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const { data: assets = [], isLoading } = useAssets();
  const { data: exchangeRates } = useExchangeRates();
  
  const rates = exchangeRates?.rates || fallbackRates;

  const filteredAssets = filter === 'all' 
    ? assets 
    : assets.filter(a => a.type === filter);

  return (
    <AppLayout>
      <div className="p-8 lg:p-12 max-w-7xl">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Assets</h1>
          <p className="text-muted-foreground">Your wealth portfolio across all categories.</p>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                filter === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Loading assets...</p>
          </div>
        ) : (
          <>
            {/* Assets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAssets.map((asset, index) => (
                <AssetCard key={asset.id} asset={asset} rates={rates} delay={index * 50} />
              ))}
            </div>

            {filteredAssets.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">
                  {assets.length === 0 
                    ? "No assets yet. Add your first asset to get started." 
                    : "No assets found in this category."
                  }
                </p>
                {assets.length === 0 && (
                  <a 
                    href="/add" 
                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Add Asset
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default AssetsPage;
