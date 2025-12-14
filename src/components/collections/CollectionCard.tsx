import { Watch, Car, Palette, Gem, Wine, Disc3, Sparkles, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, convertToEUR, fallbackRates } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Collection } from '@/hooks/useCollections';
import { Button } from '@/components/ui/button';
import { CertaintyBadge } from '@/components/ui/certainty-badge';
import { getCountryFlag } from '@/hooks/useCountries';

interface CollectionCardProps {
  collection: Collection;
  rates?: Record<string, number>;
  delay?: number;
  onEdit?: (collection: Collection) => void;
  onDelete?: (collection: Collection) => void;
  compact?: boolean;
}

const categoryIcons: Record<string, typeof Watch> = {
  'watch': Watch,
  'vehicle': Car,
  'art': Palette,
  'jewelry': Gem,
  'wine': Wine,
  'vinyl': Disc3,
  'other': Sparkles,
};

const categoryLabels: Record<string, string> = {
  'watch': 'Watch',
  'vehicle': 'Vehicle',
  'art': 'Art',
  'jewelry': 'Jewelry',
  'wine': 'Wine',
  'vinyl': 'Vinyl',
  'other': 'Other',
};

export function CollectionCard({ collection, rates, delay = 0, onEdit, onDelete, compact = false }: CollectionCardProps) {
  const Icon = categoryIcons[collection.type] || Sparkles;
  const activeRates = rates || fallbackRates;
  const eurValue = convertToEUR(collection.current_value, collection.currency, activeRates);
  const appreciation = collection.purchase_value 
    ? ((collection.current_value - collection.purchase_value) / collection.purchase_value) * 100 
    : 0;

  const hasImage = !!collection.image_url;

  // Compact mode: simplified card
  if (compact) {
    return (
      <div 
        className="collection-card animate-fade-in group p-3"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {hasImage ? (
              <img 
                src={collection.image_url!} 
                alt={collection.name}
                className="w-8 h-8 rounded-md object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-md flex items-center justify-center bg-primary/10 flex-shrink-0">
                <Icon size={16} strokeWidth={1.5} className="text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-medium text-foreground text-sm truncate">{collection.name}</h4>
                <CertaintyBadge certainty={(collection as any).certainty} showLabel={false} />
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {categoryLabels[collection.type] || collection.type}
                {collection.brand && ` · ${collection.brand}`}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatCurrency(collection.current_value, collection.currency)}
            </span>
            {appreciation !== 0 && (
              <p className={cn(
                "text-[10px] tabular-nums",
                appreciation >= 0 ? "text-positive" : "text-negative"
              )}>
                {appreciation >= 0 ? '+' : ''}{appreciation.toFixed(0)}%
              </p>
            )}
          </div>
        </div>
        
        {(onEdit || onDelete) && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(collection);
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Edit"
              >
                <Pencil size={12} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(collection);
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="collection-card animate-fade-in group"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Photo area */}
      <div className="aspect-[4/3] bg-muted flex items-center justify-center relative overflow-hidden">
        {hasImage ? (
          <img 
            src={collection.image_url!} 
            alt={collection.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Icon size={48} strokeWidth={1} className="text-muted-foreground/50" />
        )}
        
        {/* Action buttons overlay */}
        {(onEdit || onDelete) && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(collection);
                }}
              >
                <Pencil size={14} />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(collection);
                }}
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground">{collection.name}</h4>
            <CertaintyBadge certainty={(collection as any).certainty} />
          </div>
          <p className="text-sm text-muted-foreground">
            {categoryLabels[collection.type] || collection.type} · {getCountryFlag(collection.country)} {collection.country}
          </p>
          {collection.brand && collection.model && (
            <p className="text-xs text-muted-foreground">
              {collection.brand} {collection.model} {collection.year && `(${collection.year})`}
            </p>
          )}
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-lg font-semibold text-foreground tabular-nums">
            {formatCurrency(collection.current_value, collection.currency)}
          </span>
          {collection.currency !== 'EUR' && (
            <span className="text-sm text-muted-foreground tabular-nums">
              ≈ {formatCurrency(eurValue, 'EUR')}
            </span>
          )}
        </div>

        {collection.purchase_value && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Purchased: {formatCurrency(collection.purchase_value, collection.currency)}
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
