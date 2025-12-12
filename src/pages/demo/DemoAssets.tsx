import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AssetCard } from '@/components/assets/AssetCard';
import { useDemo } from '@/contexts/DemoContext';
import { fallbackRates } from '@/lib/currency';
import { fallbackCryptoPrices } from '@/hooks/useCryptoPrices';
import { cn } from '@/lib/utils';
import { Search, Info, Ruler } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Asset } from '@/hooks/useAssets';
import { DemoEditAssetDialog } from '@/components/demo/DemoEditAssetDialog';
import { DemoDeleteAssetDialog } from '@/components/demo/DemoDeleteAssetDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  
  // Property filters
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const [minRooms, setMinRooms] = useState('');
  const [minSize, setMinSize] = useState('');
  
  const { assets, entities, profile, updateProfile } = useDemo();
  const rates = fallbackRates;
  const prices = fallbackCryptoPrices;
  const areaUnit = profile?.area_unit || 'sqm';

  const toggleAreaUnit = () => {
    updateProfile({ area_unit: areaUnit === 'sqm' ? 'sqft' : 'sqm' });
  };

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
    })
    // Property type filter (only for real estate)
    .filter(a => {
      if (propertyTypeFilter === 'all') return true;
      if (a.type !== 'real-estate') return filter !== 'real-estate'; // Show non-real-estate if not filtering by real-estate
      return a.property_type === propertyTypeFilter;
    })
    // Min rooms filter
    .filter(a => {
      if (!minRooms) return true;
      if (a.type !== 'real-estate') return true;
      return (a.rooms || 0) >= parseInt(minRooms);
    })
    // Min size filter (input is in display unit, convert to sqm for comparison)
    .filter(a => {
      if (!minSize) return true;
      if (a.type !== 'real-estate') return true;
      const minSizeNum = parseFloat(minSize);
      const assetSizeSqm = a.size_sqm || 0;
      const compareSize = areaUnit === 'sqft' ? minSizeNum / 10.7639 : minSizeNum;
      return assetSizeSqm >= compareSize;
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
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-serif text-3xl font-medium text-foreground">Assets</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAreaUnit}
              className="flex items-center gap-2"
            >
              <Ruler size={14} />
              {areaUnit === 'sqm' ? 'm²' : 'sq ft'}
            </Button>
          </div>
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

          {/* Property-specific filters - show when real-estate selected or all */}
          {(filter === 'all' || filter === 'real-estate') && (
            <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Type:</span>
                <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                  <SelectTrigger className="w-32 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="penthouse">Penthouse</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Min rooms:</span>
                <Input
                  type="number"
                  min="0"
                  value={minRooms}
                  onChange={(e) => setMinRooms(e.target.value)}
                  className="w-16 h-8 text-sm"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Min size:</span>
                <Input
                  type="number"
                  min="0"
                  value={minSize}
                  onChange={(e) => setMinSize(e.target.value)}
                  className="w-20 h-8 text-sm"
                  placeholder="0"
                />
                <span className="text-xs text-muted-foreground">{areaUnit === 'sqm' ? 'm²' : 'sq ft'}</span>
              </div>
            </div>
          )}
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
              areaUnit={areaUnit}
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
