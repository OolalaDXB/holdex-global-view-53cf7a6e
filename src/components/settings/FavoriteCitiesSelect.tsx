import { useState, useMemo } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FavoriteCity } from '@/hooks/useProfile';

interface CityWithRegion extends FavoriteCity {
  region: string;
}

const AVAILABLE_CITIES: CityWithRegion[] = [
  // Europe
  { name: 'London', timezone: 'Europe/London', region: 'Europe' },
  { name: 'Paris', timezone: 'Europe/Paris', region: 'Europe' },
  { name: 'Zurich', timezone: 'Europe/Zurich', region: 'Europe' },
  { name: 'Geneva', timezone: 'Europe/Zurich', region: 'Europe' },
  { name: 'Luxembourg', timezone: 'Europe/Luxembourg', region: 'Europe' },
  { name: 'Monaco', timezone: 'Europe/Monaco', region: 'Europe' },
  { name: 'Amsterdam', timezone: 'Europe/Amsterdam', region: 'Europe' },
  { name: 'Frankfurt', timezone: 'Europe/Berlin', region: 'Europe' },
  { name: 'Madrid', timezone: 'Europe/Madrid', region: 'Europe' },
  { name: 'Milan', timezone: 'Europe/Rome', region: 'Europe' },
  { name: 'Rome', timezone: 'Europe/Rome', region: 'Europe' },
  { name: 'Vienna', timezone: 'Europe/Vienna', region: 'Europe' },
  { name: 'Prague', timezone: 'Europe/Prague', region: 'Europe' },
  { name: 'Warsaw', timezone: 'Europe/Warsaw', region: 'Europe' },
  { name: 'Moscow', timezone: 'Europe/Moscow', region: 'Europe' },
  { name: 'Istanbul', timezone: 'Europe/Istanbul', region: 'Europe' },
  { name: 'Lisbon', timezone: 'Europe/Lisbon', region: 'Europe' },
  { name: 'Dublin', timezone: 'Europe/Dublin', region: 'Europe' },
  { name: 'Brussels', timezone: 'Europe/Brussels', region: 'Europe' },
  { name: 'Stockholm', timezone: 'Europe/Stockholm', region: 'Europe' },
  { name: 'Oslo', timezone: 'Europe/Oslo', region: 'Europe' },
  { name: 'Copenhagen', timezone: 'Europe/Copenhagen', region: 'Europe' },
  { name: 'Athens', timezone: 'Europe/Athens', region: 'Europe' },
  { name: 'Budapest', timezone: 'Europe/Budapest', region: 'Europe' },
  { name: 'Helsinki', timezone: 'Europe/Helsinki', region: 'Europe' },
  { name: 'Cascais', timezone: 'Europe/Lisbon', region: 'Europe' },
  
  // Middle East
  { name: 'Dubai', timezone: 'Asia/Dubai', region: 'Middle East' },
  { name: 'Abu Dhabi', timezone: 'Asia/Dubai', region: 'Middle East' },
  { name: 'Riyadh', timezone: 'Asia/Riyadh', region: 'Middle East' },
  { name: 'Jeddah', timezone: 'Asia/Riyadh', region: 'Middle East' },
  { name: 'Doha', timezone: 'Asia/Qatar', region: 'Middle East' },
  { name: 'Kuwait City', timezone: 'Asia/Kuwait', region: 'Middle East' },
  { name: 'Manama', timezone: 'Asia/Bahrain', region: 'Middle East' },
  { name: 'Muscat', timezone: 'Asia/Muscat', region: 'Middle East' },
  { name: 'Tel Aviv', timezone: 'Asia/Tel_Aviv', region: 'Middle East' },
  { name: 'Amman', timezone: 'Asia/Amman', region: 'Middle East' },
  { name: 'Beirut', timezone: 'Asia/Beirut', region: 'Middle East' },
  { name: 'Cairo', timezone: 'Africa/Cairo', region: 'Middle East' },
  
  // Asia Pacific
  { name: 'Singapore', timezone: 'Asia/Singapore', region: 'Asia Pacific' },
  { name: 'Hong Kong', timezone: 'Asia/Hong_Kong', region: 'Asia Pacific' },
  { name: 'Tokyo', timezone: 'Asia/Tokyo', region: 'Asia Pacific' },
  { name: 'Shanghai', timezone: 'Asia/Shanghai', region: 'Asia Pacific' },
  { name: 'Beijing', timezone: 'Asia/Shanghai', region: 'Asia Pacific' },
  { name: 'Mumbai', timezone: 'Asia/Kolkata', region: 'Asia Pacific' },
  { name: 'Delhi', timezone: 'Asia/Kolkata', region: 'Asia Pacific' },
  { name: 'Bangalore', timezone: 'Asia/Kolkata', region: 'Asia Pacific' },
  { name: 'Bangkok', timezone: 'Asia/Bangkok', region: 'Asia Pacific' },
  { name: 'Jakarta', timezone: 'Asia/Jakarta', region: 'Asia Pacific' },
  { name: 'Sydney', timezone: 'Australia/Sydney', region: 'Asia Pacific' },
  { name: 'Melbourne', timezone: 'Australia/Melbourne', region: 'Asia Pacific' },
  { name: 'Auckland', timezone: 'Pacific/Auckland', region: 'Asia Pacific' },
  { name: 'Seoul', timezone: 'Asia/Seoul', region: 'Asia Pacific' },
  { name: 'Taipei', timezone: 'Asia/Taipei', region: 'Asia Pacific' },
  { name: 'Manila', timezone: 'Asia/Manila', region: 'Asia Pacific' },
  { name: 'Kuala Lumpur', timezone: 'Asia/Kuala_Lumpur', region: 'Asia Pacific' },
  { name: 'Ho Chi Minh City', timezone: 'Asia/Ho_Chi_Minh', region: 'Asia Pacific' },
  
  // Africa
  { name: 'Johannesburg', timezone: 'Africa/Johannesburg', region: 'Africa' },
  { name: 'Cape Town', timezone: 'Africa/Johannesburg', region: 'Africa' },
  { name: 'Gaborone', timezone: 'Africa/Gaborone', region: 'Africa' },
  { name: 'Nairobi', timezone: 'Africa/Nairobi', region: 'Africa' },
  { name: 'Lagos', timezone: 'Africa/Lagos', region: 'Africa' },
  { name: 'Casablanca', timezone: 'Africa/Casablanca', region: 'Africa' },
  { name: 'Mauritius', timezone: 'Indian/Mauritius', region: 'Africa' },
  { name: 'Accra', timezone: 'Africa/Accra', region: 'Africa' },
  { name: 'Addis Ababa', timezone: 'Africa/Addis_Ababa', region: 'Africa' },
  
  // Americas
  { name: 'New York', timezone: 'America/New_York', region: 'Americas' },
  { name: 'Los Angeles', timezone: 'America/Los_Angeles', region: 'Americas' },
  { name: 'Miami', timezone: 'America/New_York', region: 'Americas' },
  { name: 'San Francisco', timezone: 'America/Los_Angeles', region: 'Americas' },
  { name: 'Toronto', timezone: 'America/Toronto', region: 'Americas' },
  { name: 'Vancouver', timezone: 'America/Vancouver', region: 'Americas' },
  { name: 'São Paulo', timezone: 'America/Sao_Paulo', region: 'Americas' },
  { name: 'Mexico City', timezone: 'America/Mexico_City', region: 'Americas' },
  { name: 'Panama City', timezone: 'America/Panama', region: 'Americas' },
  { name: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires', region: 'Americas' },
  { name: 'Santiago', timezone: 'America/Santiago', region: 'Americas' },
  { name: 'Lima', timezone: 'America/Lima', region: 'Americas' },
  { name: 'Bogota', timezone: 'America/Bogota', region: 'Americas' },
  { name: 'Chicago', timezone: 'America/Chicago', region: 'Americas' },
  { name: 'Houston', timezone: 'America/Chicago', region: 'Americas' },
  
  // Caribbean & Islands
  { name: 'Cayman Islands', timezone: 'America/Cayman', region: 'Caribbean' },
  { name: 'British Virgin Islands', timezone: 'America/Tortola', region: 'Caribbean' },
  { name: 'Bermuda', timezone: 'Atlantic/Bermuda', region: 'Caribbean' },
  { name: 'Nassau', timezone: 'America/Nassau', region: 'Caribbean' },
  { name: 'Barbados', timezone: 'America/Barbados', region: 'Caribbean' },
];

const REGIONS = ['Europe', 'Middle East', 'Asia Pacific', 'Africa', 'Americas', 'Caribbean'] as const;

// Re-export FavoriteCity for backwards compatibility
export type { FavoriteCity } from '@/hooks/useProfile';

// Keep SimplifiedCity as alias for backwards compatibility
export type SimplifiedCity = FavoriteCity;

interface FavoriteCitiesSelectProps {
  value: FavoriteCity[];
  onChange: (cities: FavoriteCity[]) => void;
  maxCities?: number;
}

export const FavoriteCitiesSelect: React.FC<FavoriteCitiesSelectProps> = ({
  value,
  onChange,
  maxCities = 5,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const addCity = (cityName: string) => {
    if (value.length >= maxCities) return;
    
    const city = AVAILABLE_CITIES.find(c => c.name === cityName);
    if (city && !value.some(c => c.name === city.name)) {
      onChange([...value, { name: city.name, timezone: city.timezone }]);
    }
    setOpen(false);
    setSearchQuery('');
  };

  const removeCity = (name: string) => {
    onChange(value.filter(c => c.name !== name));
  };

  const availableCities = AVAILABLE_CITIES.filter(
    city => !value.some(c => c.name === city.name)
  );

  const filteredCitiesByRegion = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = availableCities.filter(city => 
      city.name.toLowerCase().includes(query) || 
      city.region.toLowerCase().includes(query)
    );
    
    return REGIONS.reduce((acc, region) => {
      const regionCities = filtered.filter(c => c.region === region);
      if (regionCities.length > 0) {
        acc[region] = regionCities;
      }
      return acc;
    }, {} as Record<string, CityWithRegion[]>);
  }, [availableCities, searchQuery]);

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(city => (
            <div
              key={city.name}
              className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
            >
              <span>{city.name}</span>
              <button
                onClick={() => removeCity(city.name)}
                className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {value.length < maxCities && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-64 justify-start gap-2">
              <Search size={16} className="text-muted-foreground" />
              <span className="text-muted-foreground">Search cities...</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search cities..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList className="max-h-64">
                <CommandEmpty>No city found.</CommandEmpty>
                {Object.entries(filteredCitiesByRegion).map(([region, cities]) => (
                  <CommandGroup key={region} heading={region}>
                    {cities.map(city => (
                      <CommandItem
                        key={city.name}
                        value={city.name}
                        onSelect={() => addCity(city.name)}
                      >
                        {city.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
      
      <p className="text-xs text-muted-foreground">
        {value.length}/{maxCities} cities selected
      </p>
    </div>
  );
};
