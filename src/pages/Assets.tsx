import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AssetCard } from '@/components/assets/AssetCard';
import { EditAssetDialog } from '@/components/assets/EditAssetDialog';
import { DeleteAssetDialog } from '@/components/assets/DeleteAssetDialog';
import { useAssets, Asset } from '@/hooks/useAssets';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useCryptoPrices, fallbackCryptoPrices } from '@/hooks/useCryptoPrices';
import { fallbackRates } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { RefreshCw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  
  const { data: assets = [], isLoading } = useAssets();
  const { data: exchangeRates } = useExchangeRates();
  const { data: cryptoPrices, isLoading: cryptoLoading, dataUpdatedAt } = useCryptoPrices();
  
  const rates = exchangeRates?.rates || fallbackRates;
  const prices = cryptoPrices || fallbackCryptoPrices;

  const filteredAssets = assets
    .filter(a => filter === 'all' || a.type === filter)
    .filter(a => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(query) ||
        a.institution?.toLowerCase().includes(query) ||
        a.ticker?.toLowerCase().includes(query) ||
        a.country.toLowerCase().includes(query)
      );
    });

  const hasCryptoAssets = assets.some(a => a.type === 'crypto');
  const lastCryptoUpdate = dataUpdatedAt 
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <AppLayout>
      <div className="p-8 lg:p-12 max-w-7xl">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Assets</h1>
          <p className="text-muted-foreground">Your wealth portfolio across all categories.</p>
          {hasCryptoAssets && lastCryptoUpdate && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <RefreshCw size={12} className={cryptoLoading ? 'animate-spin' : ''} />
              <span>Crypto prices updated at {lastCryptoUpdate}</span>
            </div>
          )}
        </header>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
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
                <AssetCard 
                  key={asset.id} 
                  asset={asset} 
                  rates={rates}
                  cryptoPrices={prices}
                  delay={index * 50}
                  onEdit={setEditingAsset}
                  onDelete={setDeletingAsset}
                />
              ))}
            </div>

            {filteredAssets.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">
                  {assets.length === 0 
                    ? "No assets yet. Add your first asset to get started." 
                    : searchQuery 
                      ? `No assets found matching "${searchQuery}".`
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

      {/* Edit Dialog */}
      <EditAssetDialog
        asset={editingAsset}
        open={!!editingAsset}
        onOpenChange={(open) => !open && setEditingAsset(null)}
      />

      {/* Delete Dialog */}
      <DeleteAssetDialog
        asset={deletingAsset}
        open={!!deletingAsset}
        onOpenChange={(open) => !open && setDeletingAsset(null)}
      />
    </AppLayout>
  );
};

export default AssetsPage;
