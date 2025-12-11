import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CollectionCard } from '@/components/collections/CollectionCard';
import { collections, Collection } from '@/lib/data';
import { cn } from '@/lib/utils';

type FilterType = 'all' | Collection['category'];

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

const CollectionsPage = () => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredCollections = filter === 'all' 
    ? collections 
    : collections.filter(c => c.category === filter);

  return (
    <AppLayout>
      <div className="p-8 lg:p-12 max-w-7xl">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Collections</h1>
          <p className="text-muted-foreground">Your curated collection of fine objects and alternative investments.</p>
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

        {/* Collections Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCollections.map((collection, index) => (
            <CollectionCard key={collection.id} collection={collection} delay={index * 50} />
          ))}
        </div>

        {filteredCollections.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No items found in this category.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CollectionsPage;
