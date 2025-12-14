import { useState } from 'react';

interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
}

export function useGeocode() {
  const [isGeocoding, setIsGeocoding] = useState(false);

  const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
    if (!address.trim()) return null;
    
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Verso-WealthTracker/1.0'
          }
        }
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          display_name: data[0].display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    } finally {
      setIsGeocoding(false);
    }
  };

  return { geocodeAddress, isGeocoding };
}
