import { useState } from 'react';
import { Building2, MapPin, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealEstateImageProps {
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  country: string;
  name: string;
  className?: string;
  showMapLink?: boolean;
}

// City landmark images from Unsplash (curated selection)
const CITY_IMAGES: Record<string, string> = {
  'AE': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop', // Dubai skyline
  'PT': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&h=300&fit=crop', // Lisbon
  'FR': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop', // Paris
  'GB': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop', // London
  'GE': 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=400&h=300&fit=crop', // Tbilisi
  'US': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop', // NYC
  'CH': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=400&h=300&fit=crop', // Zurich
  'ES': 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=300&fit=crop', // Barcelona
  'IT': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=300&fit=crop', // Rome
  'DE': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&h=300&fit=crop', // Berlin
  'SA': 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=400&h=300&fit=crop', // Riyadh
  'QA': 'https://images.unsplash.com/photo-1559628233-100c798642d4?w=400&h=300&fit=crop', // Doha
  'SG': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=300&fit=crop', // Singapore
  'MY': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=300&fit=crop', // Kuala Lumpur
  'TH': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=300&fit=crop', // Bangkok
  'JP': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop', // Tokyo
  'AU': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=300&fit=crop', // Sydney
};

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'; // Generic modern building

export function RealEstateImage({ 
  imageUrl, 
  latitude, 
  longitude, 
  country, 
  name,
  className,
  showMapLink = false 
}: RealEstateImageProps) {
  const [imageError, setImageError] = useState(false);
  const [mapError, setMapError] = useState(false);
  
  const hasCoordinates = latitude !== null && latitude !== undefined && 
                         longitude !== null && longitude !== undefined;
  
  const googleMapsUrl = hasCoordinates 
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : null;

  // Check if the className indicates a small size (card thumbnail)
  const isSmallSize = className?.includes('w-10') || className?.includes('w-12');

  // Priority 1: User uploaded photo
  if (imageUrl && !imageError) {
    return (
      <div className={cn("relative overflow-hidden rounded-lg", className)}>
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
        {showMapLink && googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-background/80 rounded text-xs text-foreground hover:bg-background transition-colors"
          >
            <MapPin size={12} />
            View on Maps
            <ExternalLink size={10} />
          </a>
        )}
      </div>
    );
  }

  // Priority 2: For small sizes with coordinates, show country image with map pin indicator
  // For large sizes with coordinates, try static map
  if (hasCoordinates && !mapError) {
    if (isSmallSize) {
      // For small thumbnails, show country image with a map pin overlay
      const cityImage = CITY_IMAGES[country] || DEFAULT_PROPERTY_IMAGE;
      return (
        <div className={cn("relative overflow-hidden rounded-lg", className)}>
          <img
            src={cityImage}
            alt={`Property in ${country}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary rounded-tl flex items-center justify-center">
            <MapPin size={10} className="text-primary-foreground" />
          </div>
        </div>
      );
    }
    
    // For larger sizes, use static map
    const zoom = 15;
    const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=${zoom}&size=400x300&maptype=mapnik&markers=${latitude},${longitude},lightblue`;
    
    return (
      <div className={cn("relative overflow-hidden rounded-lg", className)}>
        <img
          src={staticMapUrl}
          alt={`Map of ${name}`}
          className="w-full h-full object-cover"
          onError={() => setMapError(true)}
        />
        {showMapLink && googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-background/80 rounded text-xs text-foreground hover:bg-background transition-colors"
          >
            <MapPin size={12} />
            View on Maps
            <ExternalLink size={10} />
          </a>
        )}
      </div>
    );
  }

  // Priority 3: City/country landmark image
  const cityImage = CITY_IMAGES[country] || DEFAULT_PROPERTY_IMAGE;
  
  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <img
        src={cityImage}
        alt={`Property in ${country}`}
        className="w-full h-full object-cover opacity-60"
      />
      {!isSmallSize && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center">
            <Building2 size={24} className="text-primary" />
          </div>
        </div>
      )}
    </div>
  );
}
