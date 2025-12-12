import { Link } from 'react-router-dom';
import { Collection } from '@/hooks/useCollections';
import { formatCurrency } from '@/lib/currency';
import { Watch, Car, Palette, Gem, Wine, BarChart3, Sparkles } from 'lucide-react';

interface CollectionsGalleryProps {
  collections: Collection[];
  isBlurred?: boolean;
}

const categoryIcons: Record<string, typeof Watch> = {
  'watch': Watch,
  'vehicle': Car,
  'art': Palette,
  'jewelry': Gem,
  'wine': Wine,
  'lp-position': BarChart3,
  'other': Sparkles,
};

export function CollectionsGallery({ collections, isBlurred = false }: CollectionsGalleryProps) {
  // Only show collections with images
  const collectionsWithImages = collections.filter(c => c.image_url);
  
  if (collectionsWithImages.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-lg font-medium text-foreground">Collections Gallery</h3>
        <Link 
          to="/collections" 
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all →
        </Link>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {collectionsWithImages.slice(0, 12).map((collection, index) => {
          const Icon = categoryIcons[collection.type] || Sparkles;
          
          return (
            <Link
              key={collection.id}
              to="/collections"
              className="group relative aspect-square rounded-lg overflow-hidden bg-muted animate-fade-in cursor-pointer"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <img
                src={collection.image_url!}
                alt={collection.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={12} className="text-primary" />
                    <span className="text-xs text-muted-foreground capitalize">{collection.type}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{collection.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {isBlurred ? '•••••' : formatCurrency(collection.current_value, collection.currency)}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}