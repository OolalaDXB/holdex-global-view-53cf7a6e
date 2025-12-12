import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CollectionCard } from '@/components/collections/CollectionCard';
import { useDemo } from '@/contexts/DemoContext';
import { fallbackRates } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Search, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collection } from '@/hooks/useCollections';
import { DemoEditCollectionDialog } from '@/components/demo/DemoEditCollectionDialog';
import { DemoDeleteCollectionDialog } from '@/components/demo/DemoDeleteCollectionDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FilterType = 'all' | 'watch' | 'vehicle' | 'art' | 'jewelry' | 'wine' | 'lp-position' | 'other';
type CertaintyFilter = 'all' | 'certain' | 'estimated' | 'projected';

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'watch', label: 'Watches' },
  { value: 'vehicle', label: 'Vehicles' },
  { value: 'art', label: 'Art' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'wine', label: 'Wine' },
  { value: 'lp-position', label: 'LP Positions' },
  { value: 'other', label: 'Other' },
];

const DemoCollectionsPage = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [certaintyFilter, setCertaintyFilter] = useState<CertaintyFilter>('all');
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);
  
  const { collections } = useDemo();
  const rates = fallbackRates;

  const filteredCollections = collections
    .filter(c => filter === 'all' || c.type === filter)
    .filter(c => certaintyFilter === 'all' || (c as any).certainty === certaintyFilter)
    .filter(c => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(query) ||
        c.brand?.toLowerCase().includes(query) ||
        c.model?.toLowerCase().includes(query) ||
        c.country.toLowerCase().includes(query) ||
        c.notes?.toLowerCase().includes(query)
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
          <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Collections</h1>
          <p className="text-muted-foreground">Your curated collection of fine objects and alternative investments.</p>
        </header>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-sm flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>
            
            <Select value={certaintyFilter} onValueChange={(v) => setCertaintyFilter(v as CertaintyFilter)}>
              <SelectTrigger className="w-[160px] bg-secondary border-border">
                <SelectValue placeholder="Certainty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Certainty</SelectItem>
                <SelectItem value="certain">Confirmed</SelectItem>
                <SelectItem value="estimated">Estimated</SelectItem>
                <SelectItem value="projected">Projected</SelectItem>
              </SelectContent>
            </Select>
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

        {/* Collections Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCollections.map((collection, index) => (
            <CollectionCard 
              key={collection.id} 
              collection={collection} 
              rates={rates} 
              delay={index * 50}
              onEdit={setEditingCollection}
              onDelete={setDeletingCollection}
            />
          ))}
        </div>

        {filteredCollections.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              {collections.length === 0 
                ? "No collections yet. Add your first piece to get started." 
                : searchQuery
                  ? `No items found matching "${searchQuery}".`
                  : "No items found in this category."
              }
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <DemoEditCollectionDialog
        collection={editingCollection}
        open={!!editingCollection}
        onOpenChange={(open) => !open && setEditingCollection(null)}
      />

      {/* Delete Dialog */}
      <DemoDeleteCollectionDialog
        collection={deletingCollection}
        open={!!deletingCollection}
        onOpenChange={(open) => !open && setDeletingCollection(null)}
      />
    </AppLayout>
  );
};

export default DemoCollectionsPage;
