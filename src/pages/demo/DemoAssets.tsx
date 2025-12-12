import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AssetCard } from '@/components/assets/AssetCard';
import { useDemo } from '@/contexts/DemoContext';
import { fallbackRates } from '@/lib/currency';
import { fallbackCryptoPrices } from '@/hooks/useCryptoPrices';
import { cn } from '@/lib/utils';
import { Search, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Asset } from '@/hooks/useAssets';
import { DemoEditAssetDialog } from '@/components/demo/DemoEditAssetDialog';
import { DemoDeleteAssetDialog } from '@/components/demo/DemoDeleteAssetDialog';

type FilterType = 'all' | 'real-estate' | 'bank' | 'investment' | 'crypto' | 'business';

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All Assets' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'bank', label: 'Bank Accounts' },
  { value: 'investment', label: 'Investments' },
  { value: 'crypto', label: 'Digital Assets' },
  { value: 'business', label: 'Business' },
];

const DemoAssetsPage = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  
  const { assets, entities } = useDemo();
  const rates = fallbackRates;
  const prices = fallbackCryptoPrices;

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

  return (
    <AppLayout isDemo>
      <div className="p-8 lg:p-12 max-w-7xl">
        {/* Demo Banner */}
        <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3">
          <Info size={16} className="text-primary flex-shrink-0" />
          <span className="text-sm text-muted-foreground">
            Mode démo — Les modifications sont temporaires
          </span>
          <Badge variant="outline" className="text-xs ml-auto">Demo</Badge>
        </div>

        <header className="mb-8">
          <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Assets</h1>
          <p className="text-muted-foreground">Your wealth portfolio across all categories.</p>
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

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAssets.map((asset, index) => (
            <AssetCard 
              key={asset.id} 
              asset={asset as any} 
              rates={rates}
              cryptoPrices={prices}
              delay={index * 50}
              onEdit={setEditingAsset as any}
              onDelete={setDeletingAsset as any}
              entities={entities as any}
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
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <DemoEditAssetDialog
        asset={editingAsset}
        open={!!editingAsset}
        onOpenChange={(open) => !open && setEditingAsset(null)}
      />

      {/* Delete Dialog */}
      <DemoDeleteAssetDialog
        asset={deletingAsset}
        open={!!deletingAsset}
        onOpenChange={(open) => !open && setDeletingAsset(null)}
      />
    </AppLayout>
  );
};

export default DemoAssetsPage;
