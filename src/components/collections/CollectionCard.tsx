import { Watch, Car, Palette, Gem, Wine, BarChart3, Sparkles } from 'lucide-react';
import { Collection, formatCurrency, convertToEUR } from '@/lib/data';
import { cn } from '@/lib/utils';

interface CollectionCardProps {
  collection: Collection;
  delay?: number;
}

const categoryIcons = {
  'watch': Watch,
  'vehicle': Car,
  'art': Palette,
  'jewelry': Gem,
  'wine': Wine,
  'lp-position': BarChart3,
  'other': Sparkles,
};

const categoryLabels = {
  'watch': 'Watch',
  'vehicle': 'Vehicle',
  'art': 'Art',
  'jewelry': 'Jewelry',
  'wine': 'Wine',
  'lp-position': 'LP Position',
  'other': 'Other',
};

export function CollectionCard({ collection, delay = 0 }: CollectionCardProps) {
  const Icon = categoryIcons[collection.category];
  const eurValue = convertToEUR(collection.currentValue, collection.currency);
  const appreciation = collection.purchasePrice 
    ? ((collection.currentValue - collection.purchasePrice) / collection.purchasePrice) * 100 
    : 0;

  return (
    <div 
      className="collection-card animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Photo placeholder */}
      <div className="aspect-[4/3] bg-muted flex items-center justify-center">
        <Icon size={48} strokeWidth={1} className="text-muted-foreground/50" />
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h4 className="font-medium text-foreground">{collection.name}</h4>
          <p className="text-sm text-muted-foreground">
            {categoryLabels[collection.category]} · {collection.country}
          </p>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-lg font-semibold text-foreground tabular-nums">
            {formatCurrency(collection.currentValue, collection.currency)}
          </span>
          {collection.currency !== 'EUR' && (
            <span className="text-sm text-muted-foreground tabular-nums">
              ≈ {formatCurrency(eurValue, 'EUR')}
            </span>
          )}
        </div>

        {collection.purchasePrice && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Purchased: {formatCurrency(collection.purchasePrice, collection.currency)}
            </span>
            <span className={cn(
              "text-sm font-medium",
              appreciation >= 0 ? "text-positive" : "text-negative"
            )}>
              {appreciation >= 0 ? '+' : ''}{appreciation.toFixed(0)}%
            </span>
          </div>
        )}

        {collection.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {collection.notes}
          </p>
        )}
      </div>
    </div>
  );
}
